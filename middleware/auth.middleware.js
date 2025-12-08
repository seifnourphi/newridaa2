import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    let token;

    // Check Authorization header first (explicit override)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    // If no header token, check cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log('MFA authenticate - No token found:', {
        hasCookies: !!req.cookies,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
        hasAuthHeader: !!req.headers.authorization,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set - refusing to verify token');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    console.log('MFA authenticate - Token verified:', {
      userId: decoded.userId,
      email: decoded.email,
      path: req.path
    });
    next();
  } catch (error) {
    console.log('MFA authenticate - Token verification failed:', {
      error: error.message,
      path: req.path
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

