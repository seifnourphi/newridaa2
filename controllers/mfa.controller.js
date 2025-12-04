import User from '../models/User.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Simple base32 encoding (RFC 4648)
function toBase32(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  
  return output;
}

// @desc    Get MFA status
// @route   GET /api/auth/mfa/status
// @access  Private
export const getMfaStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('mfaEnabled');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      mfaEnabled: user.mfaEnabled || false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA status'
    });
  }
};

// @desc    Setup MFA (generate secret and QR code)
// @route   GET /api/auth/mfa/setup
// @access  Private
export const setupMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If MFA is already enabled, return that status
    if (user.mfaEnabled) {
      return res.json({
        success: true,
        mfaEnabled: true
      });
    }

    // Generate a random secret (20 bytes recommended for TOTP)
    // Convert to base32 for TOTP compatibility
    const secretBytes = crypto.randomBytes(20);
    const secretBase32 = toBase32(secretBytes);
    
    // Save secret temporarily (not enabled yet, waiting for verification)
    // Store as base32 string
    user.mfaSecret = secretBase32;
    await user.save();

    // Generate QR code URL (otpauth:// format)
    // Format: otpauth://totp/AppName:email?secret=SECRET&issuer=AppName
    // Default is 6 digits (standard TOTP)
    const appName = encodeURIComponent(process.env.APP_NAME || 'Ridaa');
    const email = encodeURIComponent(user.email);
    const otpAuthUrl = `otpauth://totp/${appName}:${email}?secret=${secretBase32}&issuer=${appName}`;
    
    // Generate QR code using external service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

    const responseData = {
      success: true,
      mfaEnabled: false,
      qrCode: qrCodeUrl,
      manualEntryKey: secretBase32, // Base32 encoded secret for manual entry
      mfaSecretId: user._id.toString() // Use user ID as secret ID
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to setup MFA'
    });
  }
};

// @desc    Verify MFA setup code
// @route   POST /api/auth/mfa/verify-setup
// @access  Private
export const verifyMfaSetup = async (req, res) => {
  try {
    const { code, mfaSecretId } = req.body;

    // Validate code exists and is a string
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required.'
      });
    }

    // Convert to string if it's not already
    const codeString = String(code).trim();

    // Validate code length
    if (codeString.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Code must be 6 digits.'
      });
    }

    // Validate code format (must be 6 digits)
    if (!/^\d{6}$/.test(codeString)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code format. Code must be exactly 6 digits.'
      });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Select mfaSecret explicitly because it has select: false in the schema
    const user = await User.findById(req.user.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({
        success: false,
        error: 'No MFA secret found. Please setup MFA first.'
      });
    }

    // TODO: Implement proper TOTP verification using speakeasy or similar
    // For now, accept any 6-digit code (NOT SECURE - for development only)
    // In production, verify against the secret using TOTP algorithm
    // For basic functionality, we'll just check that the code is 6 digits

    // Enable MFA for user
    user.mfaEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully',
      mfaEnabled: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA setup'
    });
  }
};

// @desc    Verify MFA code during login
// @route   POST /api/auth/mfa/verify-login
// @access  Public (uses tempToken instead of full auth)
export const verifyMfaLogin = async (req, res) => {
  try {
    const { code, tempToken } = req.body;

    if (!code || !tempToken) {
      return res.status(400).json({
        success: false,
        error: 'MFA code and temporary token are required'
      });
    }

    // Verify tempToken to get userId
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, secret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired temporary token'
      });
    }

    // Validate code format
    const codeString = String(code).trim();
    if (codeString.length !== 6 || !/^\d{6}$/.test(codeString)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid MFA code format. Code must be 6 digits.'
      });
    }

    // Get user with MFA secret
    const user = await User.findById(decoded.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({
        success: false,
        error: 'MFA is not enabled for this user'
      });
    }

    // TODO: Implement proper TOTP verification using speakeasy or similar
    // For now, accept any 6-digit code (NOT SECURE - for development only)
    // In production, verify against the secret using TOTP algorithm
    // For basic functionality, we'll just check that the code is 6 digits
    // This is a placeholder - you should use speakeasy.verify() or similar

    // Generate final token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA login'
    });
  }
};

// @desc    Toggle MFA (enable/disable)
// @route   POST /api/auth/mfa/toggle
// @access  Private
export const toggleMfa = async (req, res) => {
  try {
    const { enabled } = req.body;

    // Select mfaSecret explicitly because it has select: false in the schema
    const user = await User.findById(req.user.userId).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (enabled && !user.mfaSecret) {
      return res.status(400).json({
        success: false,
        error: 'MFA secret not found. Please setup MFA first.'
      });
    }

    user.mfaEnabled = enabled === true;
    
    // If disabling, optionally clear the secret
    if (!enabled) {
      user.mfaSecret = undefined;
    }
    
    await user.save();

    res.json({
      success: true,
      message: enabled ? 'MFA enabled' : 'MFA disabled',
      mfaEnabled: user.mfaEnabled
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle MFA'
    });
  }
};

