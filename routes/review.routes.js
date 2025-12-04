import express from 'express';
import { getCustomerReviews, createCustomerReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getCustomerReviews);
router.post('/', authenticate, createCustomerReview);

export default router;

