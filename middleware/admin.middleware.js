import jwt from 'jsonwebtoken';

// Admin Authentication Middleware
export const authenticateAdmin = (req, res, next) => {
  try {
    // Check for admin token in cookies first (httpOnly cookie)
    let token = req.cookies?.adminToken;
    
    // If no cookie, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    const adminSecret = process.env.ADMIN_JWT_SECRET;
    if (!adminSecret) {
      console.error('ADMIN_JWT_SECRET is not set - refusing to verify admin token');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    // Verify token with admin secret
    const decoded = jwt.verify(token, adminSecret);

    // Check if token is admin type
    if (decoded.type !== 'admin' && decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token type. Admin token required.'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Admin token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin token'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Admin authentication failed'
    });
  }
};

