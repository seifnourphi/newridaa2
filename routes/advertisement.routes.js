import express from 'express';
import { getAdvertisements } from '../controllers/advertisement.controller.js';

const router = express.Router();

router.get('/', getAdvertisements);

export default router;

