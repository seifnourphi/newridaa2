import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  verificationCode: {
    type: String,
    required: true,
    select: false
  },
  verificationCodeExpiry: {
    type: Date,
    required: true
  },
  subscribedToNewsletter: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-delete expired pending users (TTL index - deletes documents after expiry date)
pendingUserSchema.index({ verificationCodeExpiry: 1 }, { expireAfterSeconds: 0 });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export default PendingUser;

