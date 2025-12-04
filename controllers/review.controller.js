import Review from '../models/Review.model.js';
import User from '../models/User.model.js';
import mongoose from 'mongoose';
import { handleDbError, isDbConnected } from '../utils/db.util.js';

// @desc    Get customer reviews
// @route   GET /api/customer-reviews
// @access  Public
export const getCustomerReviews = async (req, res) => {
  try {
    // Check database connection before querying
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.',
        reviews: []
      });
    }

    const { productId, limit = 50 } = req.query;
    
    const query = { isApproved: true, isActive: true };
    
    // If productId is provided, filter by product
    // If productId is not provided, get general testimonials (productId is null)
    if (productId !== undefined && productId !== null && productId !== '') {
      // Convert string productId to ObjectId if needed
      if (mongoose.Types.ObjectId.isValid(productId)) {
        query.productId = new mongoose.Types.ObjectId(productId);
      } else {
        query.productId = productId;
      }
    } else {
      // Get general testimonials (no productId)
      query.productId = null;
    }
    
    const reviews = await Review.find(query)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Format reviews for frontend
    const formattedReviews = reviews.map(review => {
      // Split name into firstName and lastName for frontend compatibility
      const userName = review.userId?.name || '';
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        id: review._id.toString(),
        _id: review._id.toString(),
        productId: review.productId?.toString() || review.productId,
        rating: review.rating,
        comment: review.comment || '',
        commentAr: review.commentAr || '',
        user: review.userId ? {
          id: review.userId._id?.toString() || review.userId._id,
          firstName: firstName,
          lastName: lastName,
          name: userName,
          email: review.userId.email || '',
          avatar: review.userId.avatar || null
        } : null,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      };
    });
    
    res.json({
      success: true,
      reviews: formattedReviews
    });
  } catch (error) {
    console.error('Error fetching customer reviews:', error);
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch customer reviews');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch customer reviews'
    });
  }
};

// @desc    Create customer review
// @route   POST /api/customer-reviews
// @access  Private (requires authentication)
export const createCustomerReview = async (req, res) => {
  try {
    const { productId, rating, comment, commentAr } = req.body;
    
    // Get user from request (set by authenticate middleware)
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to submit a review'
      });
    }
    
    // productId is optional - if not provided, this is a general testimonial
    let productObjectId = null;
    if (productId) {
      // Convert productId to ObjectId if it's a valid ObjectId string
      if (mongoose.Types.ObjectId.isValid(productId)) {
        productObjectId = new mongoose.Types.ObjectId(productId);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID format'
        });
      }
    }
    
    // Convert userId to ObjectId if needed
    let userObjectId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    // Check if at least one comment is provided
    if (!comment && !commentAr) {
      return res.status(400).json({
        success: false,
        error: 'At least one comment (English or Arabic) is required'
      });
    }
    
    // Check if user already reviewed this product (or general testimonial if no productId)
    const existingReviewQuery = { userId: userObjectId };
    if (productObjectId) {
      existingReviewQuery.productId = productObjectId;
    } else {
      existingReviewQuery.productId = null; // General testimonial
    }
    const existingReview = await Review.findOne(existingReviewQuery);
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment || existingReview.comment;
      existingReview.commentAr = commentAr || existingReview.commentAr;
      existingReview.isApproved = true; // Re-approve updated review
      existingReview.isActive = true;
      
      await existingReview.save();
      
      // Populate user data
      await existingReview.populate('userId', 'name email avatar');
      
      // Split name into firstName and lastName for frontend compatibility
      const userName = existingReview.userId?.name || '';
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const formattedReview = {
        id: existingReview._id.toString(),
        _id: existingReview._id.toString(),
        productId: existingReview.productId?.toString() || existingReview.productId,
        rating: existingReview.rating,
        comment: existingReview.comment || '',
        commentAr: existingReview.commentAr || '',
        user: existingReview.userId ? {
          id: existingReview.userId._id?.toString() || existingReview.userId._id,
          firstName: firstName,
          lastName: lastName,
          name: userName,
          email: existingReview.userId.email || '',
          avatar: existingReview.userId.avatar || null
        } : null,
        createdAt: existingReview.createdAt,
        updatedAt: existingReview.updatedAt
      };
      
      return res.json({
        success: true,
        message: 'Review updated successfully',
        review: formattedReview
      });
    }
    
    // Create new review
    const review = new Review({
      productId: productObjectId,
      userId: userObjectId,
      rating,
      comment: comment || '',
      commentAr: commentAr || '',
      isApproved: true,
      isActive: true
    });
    
    await review.save();
    
    // Populate user data
    await review.populate('userId', 'name email avatar');
    
    // Split name into firstName and lastName for frontend compatibility
    const userName = review.userId?.name || '';
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const formattedReview = {
      id: review._id.toString(),
      _id: review._id.toString(),
      productId: review.productId?.toString() || review.productId,
      rating: review.rating,
      comment: review.comment || '',
      commentAr: review.commentAr || '',
      user: review.userId ? {
        id: review.userId._id?.toString() || review.userId._id,
        firstName: firstName,
        lastName: lastName,
        name: userName,
        email: review.userId.email || '',
        avatar: review.userId.avatar || null
      } : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    };
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: formattedReview
    });
  } catch (error) {
    console.error('Error creating customer review:', error);
    
    // Handle duplicate key error (user already reviewed this product)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this product'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create customer review'
    });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Private (admin only)
export const getAdminReviews = async (req, res) => {
  try {
    const { type, isActive, limit = 100, page = 1 } = req.query;
    
    const query = {};
    
    // Filter by type: 'home' (testimonials), 'product' (product reviews), or 'all'
    if (type === 'home') {
      query.productId = null; // General testimonials
    } else if (type === 'product') {
      query.productId = { $ne: null }; // Product reviews only
    }
    // If type is 'all' or not provided, get all reviews
    
    // Filter by isActive status
    if (isActive === 'true') {
      query.isActive = true;
    } else if (isActive === 'false') {
      query.isActive = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(query)
      .populate('userId', 'name email avatar')
      .populate('productId', 'name nameAr slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Review.countDocuments(query);
    
    // Format reviews for frontend
    const formattedReviews = reviews.map(review => {
      // Split name into firstName and lastName for frontend compatibility
      const userName = review.userId?.name || '';
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Format product info if exists
      let product = null;
      if (review.productId) {
        const firstImage = Array.isArray(review.productId.images) && review.productId.images.length > 0
          ? (typeof review.productId.images[0] === 'string' 
              ? review.productId.images[0] 
              : review.productId.images[0]?.url)
          : null;
        
        product = {
          id: review.productId._id?.toString() || review.productId._id,
          name: review.productId.name || '',
          nameAr: review.productId.nameAr || '',
          slug: review.productId.slug || '',
          images: firstImage ? [{ url: firstImage }] : []
        };
      }
      
      return {
        id: review._id.toString(),
        _id: review._id.toString(),
        productId: review.productId?.toString() || review.productId || null,
        rating: review.rating,
        comment: review.comment || '',
        commentAr: review.commentAr || '',
        isActive: review.isActive !== undefined ? review.isActive : true,
        isApproved: review.isApproved !== undefined ? review.isApproved : true,
        user: review.userId ? {
          id: review.userId._id?.toString() || review.userId._id,
          firstName: firstName,
          lastName: lastName,
          name: userName,
          email: review.userId.email || '',
          avatar: review.userId.avatar || null
        } : null,
        product: product,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      };
    });
    
    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reviews'
    });
  }
};

// @desc    Update review status (admin)
// @route   PATCH /api/admin/reviews
// @access  Private (admin only)
export const updateAdminReview = async (req, res) => {
  try {
    const { id, isActive, isApproved } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Review ID is required'
      });
    }
    
    // Convert id to ObjectId if needed
    let reviewObjectId;
    if (mongoose.Types.ObjectId.isValid(id)) {
      reviewObjectId = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid review ID format'
      });
    }
    
    const review = await Review.findById(reviewObjectId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Update fields if provided
    if (isActive !== undefined) {
      review.isActive = isActive;
    }
    if (isApproved !== undefined) {
      review.isApproved = isApproved;
    }
    
    await review.save();
    
    // Populate user and product data
    await review.populate('userId', 'name email avatar');
    await review.populate('productId', 'name nameAr slug images');
    
    // Split name into firstName and lastName for frontend compatibility
    const userName = review.userId?.name || '';
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Format product info if exists
    let product = null;
    if (review.productId) {
      const firstImage = Array.isArray(review.productId.images) && review.productId.images.length > 0
        ? (typeof review.productId.images[0] === 'string' 
            ? review.productId.images[0] 
            : review.productId.images[0]?.url)
        : null;
      
      product = {
        id: review.productId._id?.toString() || review.productId._id,
        name: review.productId.name || '',
        nameAr: review.productId.nameAr || '',
        slug: review.productId.slug || '',
        images: firstImage ? [{ url: firstImage }] : []
      };
    }
    
    const formattedReview = {
      id: review._id.toString(),
      _id: review._id.toString(),
      productId: review.productId?.toString() || review.productId || null,
      rating: review.rating,
      comment: review.comment || '',
      commentAr: review.commentAr || '',
      isActive: review.isActive,
      isApproved: review.isApproved,
      user: review.userId ? {
        id: review.userId._id?.toString() || review.userId._id,
        firstName: firstName,
        lastName: lastName,
        name: userName,
        email: review.userId.email || '',
        avatar: review.userId.avatar || null
      } : null,
      product: product,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    };
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: {
        review: formattedReview
      }
    });
  } catch (error) {
    console.error('Error updating admin review:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update review'
    });
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/admin/reviews
// @access  Private (admin only)
export const deleteAdminReview = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Review ID is required'
      });
    }
    
    // Convert id to ObjectId if needed
    let reviewObjectId;
    if (mongoose.Types.ObjectId.isValid(id)) {
      reviewObjectId = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid review ID format'
      });
    }
    
    const review = await Review.findByIdAndDelete(reviewObjectId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin review:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete review'
    });
  }
};

