import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name must not exceed 60 characters'] // 25 for first + 25 for last + 10 for spaces
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function () {
      // Password is required only if user is not signing in with Google
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    data: String,
    contentType: String
  },
  addresses: [{
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false
  },
  verificationCode: {
    type: String,
    select: false
  },
  verificationCodeExpiry: {
    type: Date
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpiry: {
    type: Date
  },
  subscribedToNewsletter: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password if it exists and is modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.mfaSecret;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

