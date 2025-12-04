import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.model.js';
import PendingUser from '../models/PendingUser.model.js';
import { sendVerificationCode, sendPasswordResetEmail } from '../utils/email.util.js';

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

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Validate name length (professional limit: 60 characters total)
    const trimmedName = name.trim();
    if (trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        error: 'Name must not exceed 60 characters'
      });
    }

    // Split name to validate first and last name parts
    const nameParts = trimmedName.split(' ').filter(part => part.trim());
    if (nameParts.length > 0 && nameParts[0].length > 25) {
      return res.status(400).json({
        success: false,
        error: 'First name must not exceed 25 characters'
      });
    }
    if (nameParts.length > 1) {
      const lastName = nameParts.slice(1).join(' ');
      if (lastName.length > 25) {
        return res.status(400).json({
          success: false,
          error: 'Last name must not exceed 25 characters'
        });
      }
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.'
      });
    }

    // Check if user already exists (active or inactive)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Check if there's a pending user with this email
    // If exists, delete it to allow new registration
    await PendingUser.deleteOne({ email: email.toLowerCase().trim() });

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code expiry
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setMinutes(verificationCodeExpiry.getMinutes() + 10); // 10 minutes expiry
    
    // Create pending user (NOT in User collection - only in PendingUser)
    const pendingUser = await PendingUser.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed by pre-save hook if we add one, or we hash it here
      phone: phone ? phone.trim() : undefined,
      verificationCode: verificationCode,
      verificationCodeExpiry: verificationCodeExpiry,
      subscribedToNewsletter: req.body.subscribedToNewsletter || false
    });

    // Hash password manually (since PendingUser doesn't have pre-save hook)
    const bcrypt = (await import('bcryptjs')).default;
    pendingUser.password = await bcrypt.hash(password, 10);
    await pendingUser.save();

    // Send verification code via email
    try {
      const language = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
      await sendVerificationCode(pendingUser.email, verificationCode, language);
      console.log(`✅ Verification code sent to ${pendingUser.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Delete pending user if email fails
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
      email: pendingUser.email
      // No token or user data returned - user must verify first
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB connection errors
    if (error.name === 'MongoServerError' || error.name === 'MongoNetworkError' || error.name === 'MongooseError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Normalize rememberMe to boolean (handle string "true"/"false" from form submissions)
    const shouldRemember = rememberMe === true || rememberMe === 'true' || rememberMe === 1;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active (must verify email first)
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email address before logging in. Check your email for the verification code.'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if MFA is enabled for this user
    // Select mfaSecret and mfaEnabled explicitly
    const userWithMfa = await User.findById(user._id).select('+mfaSecret mfaEnabled');
    
    if (userWithMfa.mfaEnabled && userWithMfa.mfaSecret) {
      // MFA is enabled - check if MFA code is provided
      const { mfaCode } = req.body;
      
      if (!mfaCode) {
        // MFA is required but not provided - return response indicating MFA is needed
        // Generate a temporary token for MFA verification
        const tempToken = generateToken(user._id);
        return res.status(200).json({
          success: false,
          mfaRequired: true,
          tempToken: tempToken,
          message: 'MFA code is required',
          error: 'Please enter your MFA code'
        });
      }

      // Validate MFA code format
      const codeString = String(mfaCode).trim();
      if (codeString.length !== 6 || !/^\d{6}$/.test(codeString)) {
        // Generate a temporary token for MFA verification
        const tempToken = generateToken(user._id);
        return res.status(400).json({
          success: false,
          mfaRequired: true,
          tempToken: tempToken,
          error: 'Invalid MFA code format. Code must be 6 digits.'
        });
      }

      // TODO: Implement proper TOTP verification using speakeasy or similar
      // For now, accept any 6-digit code (NOT SECURE - for development only)
      // In production, verify against the secret using TOTP algorithm
      // For basic functionality, we'll just check that the code is 6 digits
      // This is a placeholder - you should use speakeasy.verify() or similar
      
      // For now, we'll accept any 6-digit code if MFA is enabled
      // In production, replace this with actual TOTP verification:
      // const speakeasy = require('speakeasy');
      // const isValid = speakeasy.totp.verify({
      //   secret: userWithMfa.mfaSecret,
      //   encoding: 'base32',
      //   token: codeString,
      //   window: 2 // Allow 2 time steps (60 seconds) before/after
      // });
      // if (!isValid) {
      //   return res.status(401).json({
      //     success: false,
      //     requiresMfa: true,
      //     error: 'Invalid MFA code'
      //   });
      // }
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie with rememberMe support
    // If rememberMe is true, cookie expires in 30 days, otherwise 7 days
    const maxAge = shouldRemember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge
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
      error: error.message || 'Login failed'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update password'
    });
  }
};

// @desc    Verify email verification code
// @route   POST /api/auth/verify-code
// @access  Public
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.'
      });
    }

    // Find pending user (include verificationCode field)
    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase().trim() }).select('+verificationCode +password');
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        error: 'No pending registration found. Please register again.'
      });
    }

    // Verify code
    const enteredCode = code.trim();
    const storedCode = pendingUser.verificationCode;
    const codeExpiry = pendingUser.verificationCodeExpiry;

    // Check if code exists and is not expired
    if (!storedCode) {
      return res.status(400).json({
        success: false,
        error: 'No verification code found. Please request a new code.'
      });
    }

    if (codeExpiry && new Date() > new Date(codeExpiry)) {
      // Delete expired pending user
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please register again.'
      });
    }

    // Verify code matches
    if (enteredCode !== storedCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    // Check if user already exists (in case of race condition)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      // Delete pending user since actual user exists
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Code is valid - create actual user account
    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed
      phone: pendingUser.phone,
      isActive: true, // User is active after verification
      emailVerified: true,
      subscribedToNewsletter: pendingUser.subscribedToNewsletter
    });

    // Delete pending user after successful creation
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Generate token
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
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify code'
    });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.'
      });
    }

    // Check if user already exists (active)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified. Please login instead.'
      });
    }

    // Find pending user (include verificationCode field)
    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase().trim() }).select('+verificationCode');
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        error: 'No pending registration found. Please register again.'
      });
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setMinutes(verificationCodeExpiry.getMinutes() + 10); // 10 minutes expiry

    // Update pending user with new code
    pendingUser.verificationCode = verificationCode;
    pendingUser.verificationCodeExpiry = verificationCodeExpiry;
    await pendingUser.save();

    // Send verification code via email
    try {
      const language = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
      await sendVerificationCode(pendingUser.email, verificationCode, language);
      console.log(`✅ Verification code resent to ${pendingUser.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification code. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Verification code resent successfully',
      email: pendingUser.email
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resend code'
    });
  }
};

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    // Set CORS headers explicitly for Google OAuth
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    }

    const { idToken, csrfToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
    }

    // Verify CSRF token if provided
    if (csrfToken) {
      const cookieToken = req.cookies?.['csrf-token'];
      if (cookieToken && cookieToken !== csrfToken) {
        return res.status(403).json({
          success: false,
          error: 'Invalid CSRF token'
        });
      }
    }

    // Verify Google ID token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Google OAuth is not configured'
      });
    }

    const client = new OAuth2Client(clientId);
    let ticket;
    
    try {
      ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: clientId,
      });
    } catch (verifyError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google ID token'
      });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token payload'
      });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email not provided by Google'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google ID and avatar if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      // Activate user if not already active (Google email is verified)
      if (!user.isActive) {
        user.isActive = true;
        user.emailVerified = true;
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: undefined, // No password for OAuth users
        googleId,
        avatar: picture || null,
        isActive: true,
        emailVerified: true, // Google emails are verified
        subscribedToNewsletter: false
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        emailVerified: user.emailVerified || true
      },
      token
    });
  } catch (error) {
    // Set CORS headers even on error
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Google authentication failed'
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if user has password (not OAuth only)
    if (!user.password && user.googleId) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Get language from request (default to 'en')
    const language = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';

    // Send reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, resetToken, language);
      
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (emailError) {
      // If email fails, remove the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process password reset request'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required'
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset password'
    });
  }
};

