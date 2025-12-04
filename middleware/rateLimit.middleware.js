import rateLimit from 'express-rate-limit';

// Check if rate limiting is disabled
const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

// Skip function that also handles errors gracefully
const skipRateLimit = (req) => {
  try {
    return isRateLimitDisabled;
  } catch (error) {
    console.error('[Rate Limit] Error in skip function:', error);
    return false; // Don't skip if there's an error
  }
};

// General API rate limiter (for most endpoints)
// Industry standard: 1000-2000 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1500', 10), // 1500 requests per 15 minutes (industry standard)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipRateLimit, // Skip if disabled
  handler: (req, res) => {
    try {
      const resetTime = req.rateLimit?.resetTime || Date.now() + 900000;
      res.status(429).json({
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      });
    } catch (error) {
      console.error('[Rate Limit] Error in handler:', error);
      res.status(429).json({
        success: false,
        error: 'Too many requests from this IP, please try again later.'
      });
    }
  },
  // Skip rate limiting on errors
  skipFailedRequests: false,
  // Skip rate limiting on successful requests (only count failures)
  skipSuccessfulRequests: false
});

// Strict rate limiter for authentication endpoints (login, register, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again after 15 minutes.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

// Strict rate limiter for password reset and sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    error: 'Too many attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many attempts, please try again after 1 hour.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

// Moderate rate limiter for public endpoints (product views, etc.)
// Industry standard: 100-200 requests per minute
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150, // 150 requests per minute (industry standard)
  message: {
    success: false,
    error: 'Too many requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please slow down.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

// Admin rate limiter (more lenient for admin operations)
// Industry standard: 200-500 requests per minute for admin operations
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute (industry standard for admin)
  message: {
    success: false,
    error: 'Too many admin requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many admin requests, please slow down.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

