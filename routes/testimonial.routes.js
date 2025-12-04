import express from 'express';
import { getTestimonials } from '../controllers/testimonial.controller.js';

const router = express.Router();

router.get('/', getTestimonials);

export default router;

