import express from 'express';
import { uploadFile } from '../controllers/upload.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { verifyCSRF } from '../middleware/csrf.middleware.js';

const router = express.Router();

// Upload route (admin only)
router.post('/', authenticateAdmin, verifyCSRF, upload.single('file'), uploadFile);

export default router;

