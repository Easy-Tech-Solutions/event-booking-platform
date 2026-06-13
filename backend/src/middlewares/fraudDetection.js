// Rule-based fraud detection middleware for event creation/update

const SUSPICIOUS_KEYWORDS = [
  'get rich quick', 'make money fast', 'guaranteed income', 'guaranteed profit',
  'investment opportunity', 'mlm', 'multi-level marketing', 'pyramid scheme',
  'no experience needed', 'earn from home', 'work from home unlimited',
  'click here to claim', 'limited offer', 'act now', 'crypto giveaway',
  'bitcoin giveaway', 'nft giveaway', 'free money', 'send money',
  'wire transfer required', 'cash only', 'advance fee',
  'nigerian prince', 'lottery winner', 'you have been selected',
];

const HIGH_PRICE_THRESHOLD_NEW_ORGANIZER_DAYS = 30;
const HIGH_PRICE_THRESHOLD = 500;
const MIN_DESCRIPTION_LENGTH = 50;

const containsSuspiciousKeywords = (text = '') => {
  const lower = text.toLowerCase();
  return SUSPICIOUS_KEYWORDS.filter((kw) => lower.includes(kw));
};

export const fraudDetection = async (req, res, next) => {
  try {
    const { title = '', description = '', ticketTypes = [] } = req.body;
    const user = req.user;

    const flags = [];
    let score = 0;

    // ── Keyword check ─────────────────────────────────────────────────────────
    const titleMatches = containsSuspiciousKeywords(title);
    const descMatches = containsSuspiciousKeywords(description);

    if (titleMatches.length > 0) {
      flags.push(`suspicious_keywords_in_title: ${titleMatches.join(', ')}`);
      score += 30 * titleMatches.length;
    }
    if (descMatches.length > 0) {
      flags.push(`suspicious_keywords_in_description: ${descMatches.join(', ')}`);
      score += 15 * descMatches.length;
    }

    // ── Very short description ────────────────────────────────────────────────
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      flags.push('description_too_short');
      score += 10;
    }

    // ── Duplicate title check ─────────────────────────────────────────────────
    const { default: Event } = await import('../models/Event.model.js');
    const existingTitle = await Event.findOne({
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      organizer: { $ne: user._id },
    }).lean();

    if (existingTitle) {
      flags.push('duplicate_title_from_different_organizer');
      score += 40;
    }

    // ── New organizer + high ticket price ────────────────────────────────────
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    if (accountAgeDays < HIGH_PRICE_THRESHOLD_NEW_ORGANIZER_DAYS) {
      const maxPrice = ticketTypes.reduce((max, t) => Math.max(max, t.price || 0), 0);
      if (maxPrice > HIGH_PRICE_THRESHOLD) {
        flags.push(`new_organizer_high_price: $${maxPrice}`);
        score += 25;
      }
    }

    // ── Attach results to request for downstream use ──────────────────────────
    req.fraudResult = { flags, score, isFlagged: score >= 30 };
    next();
  } catch (err) {
    next(err);
  }
};
