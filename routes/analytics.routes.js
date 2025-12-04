import express from 'express';
import { getAnalytics, trackAnalytics } from '../controllers/analytics.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public endpoint for tracking events (no authentication required)
router.post('/', trackAnalytics);

// Admin endpoint for getting analytics data
router.get('/', authenticateAdmin, getAnalytics);

export default router;

