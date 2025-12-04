import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAccount
} from '../controllers/account.controller.js';
import { getOrderInvoice, trackOrderByQuery } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { verifyCSRF } from '../middleware/csrf.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Avatar upload route must come before /profile routes to avoid route conflicts
router.post('/profile/avatar', authenticate, verifyCSRF, upload.single('avatar'), uploadAvatar);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, verifyCSRF, updateProfile);
router.put('/profile', authenticate, verifyCSRF, updateProfile); // Support PUT as well
router.delete('/delete-account', authenticate, verifyCSRF, deleteAccount);

// Track order route - must be before /orders/:id to avoid route conflict
router.get('/track-order', trackOrderByQuery); // Public endpoint for tracking orders

// Orders routes under account - support both user and admin authentication
router.get('/orders/:id/invoice', authenticateUserOrAdmin, getOrderInvoice);

// Middleware to support both user and admin authentication
function authenticateUserOrAdmin(req, res, next) {
  // Try admin authentication first
  let adminAuthenticated = false;
  
  // Check for admin token
  try {
    let adminToken = req.cookies?.adminToken;
    if (!adminToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        adminToken = authHeader.substring(7);
      }
    }
    
    if (adminToken) {
      const decoded = jwt.verify(
        adminToken,
        process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-admin-secret-key'
      );
      
      if (decoded.type === 'admin' || decoded.role === 'admin') {
        req.admin = decoded;
        req.user = decoded; // Set for compatibility
        adminAuthenticated = true;
        return next();
      }
    }
  } catch (error) {
    // Admin auth failed, continue to user auth
  }
  
  // If admin auth failed, try user authentication
  authenticate(req, res, next);
}

export default router;

