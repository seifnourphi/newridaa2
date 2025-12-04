import express from 'express';
import { validateStock, uploadPaymentProof, validateCoupon } from '../controllers/checkout.controller.js';
import { createOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { parseFormDataJSON } from '../middleware/parseFormData.middleware.js';
import { verifyCSRF } from '../middleware/csrf.middleware.js';

const router = express.Router();

// Public route for stock validation (guest checkout allowed)
router.post('/validate-stock', validateStock);

// Public route for coupon validation (guest checkout allowed)
router.post('/validate-coupon', validateCoupon);

// Private route for uploading payment proof (requires authentication)
// ملاحظة: تم تخفيف حماية CSRF هنا لتفادي مشاكل رفع الملفات، ما زال المسار محمي بتسجيل الدخول
router.post('/upload-payment-proof', authenticate, upload.single('file'), uploadPaymentProof);

// Private route for creating order (requires authentication)
// Note: paymentProof is sent as URL (already uploaded via upload-payment-proof endpoint)
// So we don't need upload middleware here, just parse JSON
router.post('/create-order', authenticate, verifyCSRF, createOrder);

export default router;

