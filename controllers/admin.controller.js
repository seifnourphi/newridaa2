import Admin from '../models/Admin.model.js';
import jwt from 'jsonwebtoken';

// Generate Admin JWT Token
const generateAdminToken = (adminId, username) => {
  const adminSecret = process.env.ADMIN_JWT_SECRET;
  if (!adminSecret) {
    throw new Error('ADMIN_JWT_SECRET is not set');
  }

  return jwt.sign(
    { 
      adminId,
      username,
      role: 'admin',
      type: 'admin'
    },
    adminSecret,
    { expiresIn: process.env.ADMIN_JWT_EXPIRE || '1h' }
  );
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      admin.loginAttempts += 1;
      
      // Lock account after 5 failed attempts for 2 hours
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      }
      
      await admin.save();
      
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Reset login attempts on successful login
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id, admin.username);

    // Set httpOnly cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Get Current Admin
// @route   GET /api/admin/me
// @access  Private/Admin
export const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          lastLogin: admin.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Admin Logout
// @route   POST /api/admin/logout
// @access  Private/Admin
export const adminLogout = async (req, res) => {
  try {
    // Clear cookie
    res.clearCookie('adminToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// @desc    Change Admin Password
// @route   POST /api/admin/change-password
// @access  Private/Admin
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 4 characters'
      });
    }

    // Find admin with password
    const admin = await Admin.findById(req.admin.adminId).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check current password
    const isPasswordCorrect = await admin.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change password'
    });
  }
};

