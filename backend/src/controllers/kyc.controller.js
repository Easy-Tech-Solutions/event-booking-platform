import OrganizerKyc from '../models/OrganizerKyc.model.js';
import { uploadImage } from '../config/cloudinary.js';

// ─── GET /api/kyc/me ──────────────────────────────────────────────────────────
export const getMyKyc = async (req, res, next) => {
  try {
    const kyc = await OrganizerKyc.findOne({ organizer: req.user._id });
    return res.json({ kyc: kyc || null });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/kyc ────────────────────────────────────────────────────────────
// Submit or resubmit KYC
export const submitKyc = async (req, res, next) => {
  try {
    const { businessName, businessType, taxId, country, address, website } = req.body;

    if (!businessName?.trim() || !country?.trim()) {
      return res.status(400).json({ message: 'businessName and country are required.' });
    }

    const existing = await OrganizerKyc.findOne({ organizer: req.user._id });
    if (existing && ['pending', 'under_review'].includes(existing.status)) {
      return res.status(400).json({ message: 'Your KYC submission is already under review.' });
    }

    const updateData = {
      organizer: req.user._id,
      businessName: businessName.trim(),
      businessType: businessType || 'individual',
      taxId: taxId?.trim(),
      country: country.trim(),
      address: address?.trim(),
      website: website?.trim(),
      status: 'pending',
      adminNote: undefined,
    };

    // Handle document uploads
    if (req.files?.idDocument?.[0]) {
      const file = req.files.idDocument[0];
      const result = await uploadImage(file.buffer, file.mimetype, 'kyc');
      updateData.idDocumentUrl = result.secure_url;
    }
    if (req.files?.businessDocument?.[0]) {
      const file = req.files.businessDocument[0];
      const result = await uploadImage(file.buffer, file.mimetype, 'kyc');
      updateData.businessDocumentUrl = result.secure_url;
    }

    let kyc;
    if (existing) {
      Object.assign(existing, updateData);
      kyc = await existing.save();
    } else {
      kyc = await OrganizerKyc.create(updateData);
    }

    return res.status(201).json({ message: 'KYC submission received.', kyc });
  } catch (err) {
    next(err);
  }
};
