import express from 'express';
import {
  getMfaStatus,
  setupMfa,
  verifyMfaSetup,
  verifyMfaLogin,
  toggleMfa
} from '../controllers/mfa.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { strictLimiter, mfaVerifyLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// All MFA routes require authentication except verify-login (uses tempToken)
router.get('/status', authenticate, getMfaStatus);
router.get('/setup', authenticate, setupMfa);
router.post('/verify-setup', strictLimiter, authenticate, verifyMfaSetup);
router.post('/verify-login', mfaVerifyLimiter, verifyMfaLogin); // Public - uses tempToken, more lenient rate limit
router.post('/toggle', strictLimiter, authenticate, toggleMfa);

export default router;

