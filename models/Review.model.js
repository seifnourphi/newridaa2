import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false, // Optional - allows general testimonials without product
    index: true,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: false,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  commentAr: {
    type: String,
    required: false,
    maxlength: [500, 'Arabic comment cannot exceed 500 characters']
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve reviews by default
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Compound index to prevent duplicate reviews from same user for same product
// Only enforce uniqueness if productId exists (for product reviews)
// For general testimonials (no productId), allow multiple reviews per user
reviewSchema.index({ productId: 1, userId: 1 }, { 
  unique: true,
  partialFilterExpression: { productId: { $ne: null } }
});

// Index for faster queries
reviewSchema.index({ productId: 1, isApproved: 1, isActive: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

