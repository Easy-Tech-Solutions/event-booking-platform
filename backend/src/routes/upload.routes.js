import express from "express";
import { authenticate } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import { uploadImage, hasCloudinaryCredentials } from "../config/cloudinary.js";

const router = express.Router();

// POST /api/upload?folder=blog|events|avatars|general
router.post("/", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided." });
    }
    if (!hasCloudinaryCredentials()) {
      return res.status(503).json({ message: "Image upload is not configured on this server." });
    }
    const folder = (req.query.folder || "general").replace(/[^a-zA-Z0-9_-]/g, "");
    const result = await uploadImage(req.file.buffer, req.file.mimetype, folder);
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});

export default router;
