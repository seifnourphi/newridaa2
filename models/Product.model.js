import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SIZE', 'COLOR'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  valueAr: String,
  stock: {
    type: Number,
    default: 0
  }
}, { _id: false });

const variantCombinationSchema = new mongoose.Schema({
  size: String,
  color: String,
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  nameAr: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  descriptionAr: String,
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be positive']
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price must be positive']
  },
  originalPrice: Number,
  discountPercent: Number,
  images: [{
    data: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    alt: String,
    altAr: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  variants: [variantSchema],
  variantCombinations: [variantCombinationSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  tags: [String],
  metaTitle: String,
  metaDescription: String
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Index for search
productSchema.index({ name: 'text', nameAr: 'text', description: 'text', descriptionAr: 'text' });
// slug index is already created by unique: true, so we don't need to add it again
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;

