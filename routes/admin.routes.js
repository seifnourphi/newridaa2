import express from 'express';
import {
  adminLogin,
  getCurrentAdmin,
  adminLogout,
  changePassword
} from '../controllers/admin.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { authLimiter, strictLimiter, adminLimiter } from '../middleware/rateLimit.middleware.js';
import { verifyCSRF } from '../middleware/csrf.middleware.js';
import { 
  getAdminProducts, 
  getProductsStats,
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller.js';
import { getAdminReviews, updateAdminReview, deleteAdminReview } from '../controllers/review.controller.js';
import { 
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import { 
  getCoupons,
  getAdminCoupons, 
  getCoupon,
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} from '../controllers/coupon.controller.js';
import { 
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser
} from '../controllers/user.controller.js';
import { 
  getAdminAdvertisements,
  getAdminAdvertisement,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  seedAdvertisements,
  exportAdvertisementsAsDefaults
} from '../controllers/advertisement.controller.js';
import { 
  getAdminOrders,
  getAdminOrdersStats,
  updateAdminOrder
} from '../controllers/order.controller.js';
import { 
  getSubscribersCount,
  getSubscribers,
  sendNewsletter,
  sendTestNewsletter
} from '../controllers/newsletter.controller.js';
import { getAdminAnalytics } from '../controllers/analytics.controller.js';
import { getAdminSettings, updateAdminSettings } from '../controllers/settings.controller.js';
import { getSections, updateSections } from '../controllers/section.controller.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', authLimiter, adminLogin);

// Protected routes
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post('/logout', authenticateAdmin, verifyCSRF, adminLogout);
router.post('/change-password', strictLimiter, authenticateAdmin, verifyCSRF, changePassword);

// Products routes (admin only)
router.get('/products', authenticateAdmin, getAdminProducts);
router.get('/products/stats', authenticateAdmin, getProductsStats);
router.get('/products/:id', authenticateAdmin, getProduct);
router.post('/products', authenticateAdmin, verifyCSRF, uploadMultiple, createProduct);
router.put('/products/:id', authenticateAdmin, verifyCSRF, uploadMultiple, updateProduct);
router.patch('/products/:id', authenticateAdmin, verifyCSRF, updateProduct); // Support PATCH for partial updates
router.delete('/products/:id', authenticateAdmin, verifyCSRF, deleteProduct);

// Categories routes (admin only)
router.get('/categories', authenticateAdmin, getAdminCategories);
router.post('/categories', authenticateAdmin, verifyCSRF, createCategory);
router.put('/categories/:id', authenticateAdmin, verifyCSRF, updateCategory);
router.patch('/categories/:id', authenticateAdmin, verifyCSRF, updateCategory); // Support PATCH as well
router.delete('/categories/:id', authenticateAdmin, verifyCSRF, deleteCategory);

// Coupons routes (admin only)
router.get('/coupons', authenticateAdmin, getAdminCoupons);
router.get('/coupons/:id', authenticateAdmin, getCoupon);
router.post('/coupons', authenticateAdmin, verifyCSRF, createCoupon);
router.put('/coupons/:id', authenticateAdmin, verifyCSRF, updateCoupon);
router.delete('/coupons/:id', authenticateAdmin, verifyCSRF, deleteCoupon);

// Users routes (admin only)
router.get('/users', authenticateAdmin, getAdminUsers);
router.get('/users/:id', authenticateAdmin, getAdminUser);
router.put('/users/:id', authenticateAdmin, verifyCSRF, updateAdminUser);
router.delete('/users/:id', authenticateAdmin, verifyCSRF, deleteAdminUser);

// Advertisements routes (admin only)
router.get('/advertisements', authenticateAdmin, getAdminAdvertisements);
router.get('/advertisements/export-defaults', authenticateAdmin, exportAdvertisementsAsDefaults);
router.get('/advertisements/:id', authenticateAdmin, getAdminAdvertisement);
router.post('/advertisements', authenticateAdmin, verifyCSRF, createAdvertisement);
router.post('/advertisements/seed', authenticateAdmin, verifyCSRF, seedAdvertisements);
router.put('/advertisements', authenticateAdmin, verifyCSRF, updateAdvertisement); // Support id in body
router.put('/advertisements/:id', authenticateAdmin, verifyCSRF, updateAdvertisement); // Support id in params
router.delete('/advertisements/:id', authenticateAdmin, verifyCSRF, deleteAdvertisement);

// Newsletter routes (admin only)
router.get('/newsletter/subscribers/count', authenticateAdmin, getSubscribersCount);
router.get('/newsletter/subscribers', authenticateAdmin, getSubscribers);
router.post('/newsletter/test', authenticateAdmin, verifyCSRF, sendTestNewsletter);
router.post('/newsletter/send', authenticateAdmin, verifyCSRF, sendNewsletter);

// Analytics routes (admin only)
router.get('/analytics', authenticateAdmin, getAdminAnalytics);

// Settings routes (admin only)
router.get('/settings', authenticateAdmin, getAdminSettings);
router.put('/settings', authenticateAdmin, verifyCSRF, updateAdminSettings);
router.patch('/settings', authenticateAdmin, verifyCSRF, updateAdminSettings); // Support PATCH as well

// Sections routes (admin only)
router.get('/sections', authenticateAdmin, getSections);
router.post('/sections', authenticateAdmin, verifyCSRF, updateSections);

// Orders routes (admin only)
router.get('/orders', authenticateAdmin, getAdminOrders);
router.get('/orders/stats', authenticateAdmin, getAdminOrdersStats);
router.patch('/orders/:id', authenticateAdmin, verifyCSRF, updateAdminOrder);

// Reviews routes (admin only)
router.get('/reviews', authenticateAdmin, getAdminReviews);
router.patch('/reviews', authenticateAdmin, verifyCSRF, updateAdminReview);
router.delete('/reviews', authenticateAdmin, verifyCSRF, deleteAdminReview);

export default router;

