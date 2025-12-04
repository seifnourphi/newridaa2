import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: String,
  color: String,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String
  },
  billingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'instapay', 'vodafone'],
    default: 'cash_on_delivery'
  },
  shippingPaymentMethod: {
    type: String,
    enum: ['instapay', 'vodafone'],
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentProof: String,
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: String,
  notes: String,
  cancelledAt: Date,
  cancelledReason: String
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  try {
    if (!this.orderNumber) {
      // Use a more reliable method to generate unique order number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      this.orderNumber = `ORD-${timestamp}-${String(random).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// orderNumber index is already created by unique: true
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

