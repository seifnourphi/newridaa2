import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  updatePassword,
  verifyCode,
  resendCode,
  googleLogin,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { verifyCSRF } from '../middleware/csrf.middleware.js';
import { authLimiter, strictLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Apply strict rate limiting to authentication endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Handle OPTIONS for Google OAuth (CORS preflight)
router.options('/google', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  }
  res.sendStatus(200);
});

router.post('/google', authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', strictLimiter, resetPassword);
router.post('/verify-code', strictLimiter, verifyCode);
router.post('/resend-code', strictLimiter, resendCode);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.put('/password', strictLimiter, authenticate, verifyCSRF, updatePassword);

export default router;

