import mongoose from 'mongoose';

const advertisementImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  alt: String,
  altAr: String,
  name: String,
  nameAr: String,
  price: Number,
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  _id: true,
  timestamps: false
});

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  titleAr: {
    type: String,
    required: [true, 'Title (Arabic) is required']
  },
  subtitle: String,
  subtitleAr: String,
  badge: String,
  badgeAr: String,
  badgeColor: {
    type: String,
    default: '#DAA520' // Default golden color
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  descriptionAr: {
    type: String,
    required: [true, 'Description (Arabic) is required']
  },
  buttonText: String,
  buttonTextAr: String,
  image: {
    type: String,
    default: '/uploads/good.png' // Default placeholder image
  },
  price: Number,
  originalPrice: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  displayType: {
    type: String,
    enum: ['SINGLE', 'MULTIPLE', 'GRID', 'FEATURED', 'CAROUSEL'],
    default: 'SINGLE'
  },
  highlightedWord: String,
  highlightedWordAr: String,
  highlightedWordColor: String,
  highlightedWordUnderline: {
    type: Boolean,
    default: false
  },
  showDiscountBadge: {
    type: Boolean,
    default: true
  },
  discountBadgePosition: {
    type: String,
    enum: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
    default: 'top-right'
  },
  // Features for Premium Quality Products (SINGLE display type)
  features: [{
    title: String,
    titleAr: String,
    icon: String, // Optional icon name or URL
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  // Testimonial for Premium Quality Products
  testimonialText: String,
  testimonialTextAr: String,
  testimonialAuthor: String,
  testimonialAuthorAr: String,
  // Promotional badges (e.g., "25% OFF", "Free Shipping")
  promotionalBadges: [{
    text: String,
    textAr: String,
    icon: String, // Optional icon (e.g., "🛒", "❤️", or icon URL)
    backgroundColor: String, // Optional background color
    textColor: String, // Optional text color
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  // Multiple buttons support
  buttons: [{
    text: String,
    textAr: String,
    href: String, // Link URL
    variant: {
      type: String,
      enum: ['primary', 'secondary', 'outline'],
      default: 'primary'
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  images: [advertisementImageSchema]
}, {
  timestamps: true
});

// Index for sorting
advertisementSchema.index({ sortOrder: 1, createdAt: -1 });
advertisementSchema.index({ isActive: 1 });

const Advertisement = mongoose.model('Advertisement', advertisementSchema);

export default Advertisement;

