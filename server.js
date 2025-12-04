import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Import rate limiters
import { apiLimiter, publicLimiter } from './middleware/rateLimit.middleware.js';
// Import error handler
import { errorHandler, notFound } from './middleware/error.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import userRoutes from './routes/user.routes.js';
import accountRoutes from './routes/account.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import advertisementRoutes from './routes/advertisement.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adminRoutes from './routes/admin.routes.js';
import categoryRoutes from './routes/category.routes.js';
import sectionRoutes from './routes/section.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import mfaRoutes from './routes/mfa.routes.js';

// Load environment variables
dotenv.config();

// Basic security check for required secrets
const requiredEnvVars = ['JWT_SECRET', 'ADMIN_JWT_SECRET'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Environment variable ${key} is not set. JWT operations will fail until it is configured.`);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));

// Enhanced CORS configuration for Google OAuth
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or Google OAuth)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://accounts.google.com',
      'https://*.googleapis.com',
      'https://*.google.com'
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return origin === allowed;
    })) {
      callback(null, true);
    } else {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes with rate limiting
// Auth routes have stricter rate limiting (applied in auth.routes.js)
app.use('/api/auth', authRoutes);
app.use('/api/auth/mfa', mfaRoutes);
// Public endpoints (products, categories) use public limiter
app.use('/api/products', publicLimiter, productRoutes);
app.use('/api/categories', publicLimiter, categoryRoutes);
app.use('/api/sections', publicLimiter, sectionRoutes);
// Other routes use general API limiter
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/checkout', apiLimiter, checkoutRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/account', apiLimiter, accountRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/coupons', apiLimiter, couponRoutes);
app.use('/api/advertisements', apiLimiter, advertisementRoutes);
app.use('/api/testimonials', apiLimiter, testimonialRoutes);
app.use('/api/customer-reviews', apiLimiter, reviewRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// 404 handler (must be last)
app.use(notFound);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ridaa');
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Server will start without MongoDB. Some features may not work.');
    return false;
  }
};

// Start server (with or without MongoDB for development)
const startServer = async () => {
  const dbConnected = await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (!dbConnected) {
      console.log('⚠️  Running without MongoDB - API endpoints will return errors');
    }
  });
};

startServer();

export default app;

