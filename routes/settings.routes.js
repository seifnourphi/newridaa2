import express from 'express';
import { getStoreSettings, getSeoSettings, getWhatsAppNumber, updateWhatsAppNumber, getPagesContent } from '../controllers/settings.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// @route   GET /api/settings/store
// @access  Public
router.get('/store', getStoreSettings);

// @route   GET /api/settings/seo
// @access  Public
router.get('/seo', getSeoSettings);

// @route   GET /api/settings/whatsapp
// @access  Public
router.get('/whatsapp', getWhatsAppNumber);

// @route   PUT /api/settings/whatsapp
// @access  Private/Admin
router.put('/whatsapp', authenticateAdmin, updateWhatsAppNumber);

// @route   GET /api/settings/pages-content
// @access  Public
router.get('/pages-content', getPagesContent);

export default router;
