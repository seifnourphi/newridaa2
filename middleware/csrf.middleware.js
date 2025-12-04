import crypto from 'crypto';

// Name of the CSRF cookie as set by the frontend Next.js app
const CSRF_COOKIE_NAME = 'csrfToken';

// Middleware to verify CSRF token using double-submit cookie pattern
export const verifyCSRF = (req, res, next) => {
  try {
    const method = req.method.toUpperCase();
    // Only enforce CSRF on state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'];
    const bodyToken = req.body?.csrfToken;
    const queryToken = req.query?.csrfToken;

    const requestToken = (headerToken || bodyToken || queryToken || '').toString();

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF Debug]', {
        method: req.method,
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
        hasBody: !!bodyToken,
        hasQuery: !!queryToken,
        cookieLength: cookieToken?.length || 0,
        requestTokenLength: requestToken?.length || 0,
      });
    }

    if (!cookieToken || !requestToken) {
      return res.status(403).json({
        success: false,
        // User-facing, friendly message (Arabic + English)
        error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى / Your session has expired. Please sign in again.',
        code: 'CSRF_MISSING',
        debug: process.env.NODE_ENV === 'development' ? {
          hasCookie: !!cookieToken,
          hasHeader: !!headerToken,
          hasBody: !!bodyToken,
          hasQuery: !!queryToken,
        } : undefined,
      });
    }

    // Constant-time comparison to reduce timing attacks
    const a = Buffer.from(cookieToken);
    const b = Buffer.from(requestToken);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(403).json({
        success: false,
        error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى / Your session has expired. Please sign in again.',
        code: 'CSRF_INVALID',
      });
    }

    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى / Your session has expired. Please sign in again.',
      code: 'CSRF_ERROR',
    });
  }
};


