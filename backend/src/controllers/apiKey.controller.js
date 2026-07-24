import ApiKey from '../models/ApiKey.model.js';

// POST /api/developer/keys
export const createApiKey = async (req, res, next) => {
  try {
    const { name, scopes, expiresAt } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Key name is required.' });

    const rawKey = ApiKey.generateKey();
    const keyHash = ApiKey.hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12); // "ehub_" + 7 chars

    const apiKey = await ApiKey.create({
      user: req.user._id,
      name: name.trim(),
      keyHash,
      keyPrefix,
      scopes: scopes || ['events:read'],
      expiresAt: expiresAt || null,
    });

    // Return the raw key ONCE — never stored in plain text
    return res.status(201).json({
      message: 'API key created. Save this key — it will not be shown again.',
      apiKey: { ...apiKey.toObject(), rawKey },
    });
  } catch (err) { next(err); }
};

// GET /api/developer/keys
export const getApiKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({ apiKeys: keys });
  } catch (err) { next(err); }
};

// DELETE /api/developer/keys/:id  — revoke
export const revokeApiKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });
    if (!key) return res.status(404).json({ message: 'API key not found.' });
    key.isActive = false;
    await key.save();
    return res.json({ message: 'API key revoked.' });
  } catch (err) { next(err); }
};

// Middleware: authenticate via API key (for public developer API)
export const apiKeyAuth = async (req, res, next) => {
  try {
    const rawKey = req.header('X-API-Key');
    if (!rawKey) return res.status(401).json({ message: 'X-API-Key header required.' });

    const keyHash = ApiKey.hashKey(rawKey);
    const apiKey = await ApiKey.findOne({ keyHash, isActive: true }).populate('user');

    if (!apiKey) return res.status(401).json({ message: 'Invalid or revoked API key.' });
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return res.status(401).json({ message: 'API key expired.' });
    }

    await ApiKey.findByIdAndUpdate(apiKey._id, {
      $set: { lastUsedAt: new Date() },
      $inc: { requestCount: 1 },
    });

    req.user = apiKey.user;
    req.apiKeyScopes = apiKey.scopes;
    next();
  } catch (err) { next(err); }
};

// Middleware: require a specific scope
export const requireScope = (scope) => (req, res, next) => {
  if (!req.apiKeyScopes?.includes(scope)) {
    return res.status(403).json({ message: `Scope '${scope}' required.` });
  }
  next();
};
