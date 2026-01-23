import crypto from 'crypto';

// Middleware to verify CSRF token using double-submit cookie pattern
export const verifyCSRF = (req, res, next) => {
  try {
    const method = req.method.toUpperCase();
    // Only enforce CSRF on state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    // Determine cookie name based on route
    // Admin routes are prefixed with /api/admin or are handled by adminRoutes
    const isAdminPath = req.baseUrl.includes('/admin') || req.path.includes('/admin') || req.baseUrl.includes('/upload') || req.path.includes('/upload');
    const cookieName = isAdminPath ? 'adminCsrfToken' : 'csrfToken';

    const cookieToken = req.cookies?.[cookieName];
    const headerToken = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'];
    const bodyToken = req.body?.csrfToken;
    const queryToken = req.query?.csrfToken;

    const requestToken = (headerToken || bodyToken || queryToken || '').toString();

    // Debug logging for CSRF
    if (process.env.NODE_ENV !== 'production' || req.query.debug === 'true') {
      console.log('🛡️ CSRF Verification Check:', {
        url: req.originalUrl,
        method: req.method,
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
        hasBody: !!bodyToken,
        hasQuery: !!queryToken,
        tokensMatch: cookieToken === requestToken
      });
    }

    // Simplified check for performance
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


