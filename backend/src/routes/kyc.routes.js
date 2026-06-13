import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getMyKyc, submitKyc } from '../controllers/kyc.controller.js';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

const router = express.Router();

router.get('/me', authenticate, authorize('organizer', 'admin', 'superadmin'), getMyKyc);
router.post(
  '/',
  authenticate,
  authorize('organizer', 'admin', 'superadmin'),
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'businessDocument', maxCount: 1 },
  ]),
  submitKyc,
);

export default router;
