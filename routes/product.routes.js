import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:slug', getProduct);
router.post('/', authenticate, authorize('admin'), uploadMultiple, createProduct);
router.put('/:id', authenticate, authorize('admin'), uploadMultiple, updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;

