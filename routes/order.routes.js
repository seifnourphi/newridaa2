import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  trackOrder,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { parseFormDataJSON } from '../middleware/parseFormData.middleware.js';

const router = express.Router();

router.post('/', authenticate, upload.single('paymentProof'), parseFormDataJSON, createOrder);
router.get('/', authenticate, getOrders);
router.get('/track/:orderNumber', trackOrder);
router.get('/:id', authenticate, getOrder);
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);

export default router;

