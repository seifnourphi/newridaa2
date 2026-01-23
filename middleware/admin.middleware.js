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
    // We check both type and role for backward compatibility and flexibility
    const role = decoded.role ? String(decoded.role).toLowerCase() : null;
    const type = decoded.type ? String(decoded.type).toLowerCase() : null;

    if (type !== 'admin' && role !== 'admin') {
      console.warn('🛑 [Admin Auth] 403 Forbidden - Invalid token identity:', {
        userId: decoded.userId || decoded.adminId || 'unknown',
        username: decoded.username || 'unknown',
        role: decoded.role,
        type: decoded.type,
        path: req.originalUrl || req.url,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Invalid token identity. Admin access required.',
        code: 'ADMIN_ACCESS_DENIED'
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

