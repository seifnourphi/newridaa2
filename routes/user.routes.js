import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Placeholder for user routes
router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint'
  });
});

export default router;

