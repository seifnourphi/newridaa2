import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';
import Settings from '../models/Settings.model.js';
import { generateInvoiceHTML } from './invoice-template.js';
import { sendOrderNotification, sendLowStockAlert, sendOrderStatusUpdateNotification } from '../utils/notification.util.js';


// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    // Support both old format (shippingAddress object) and new format (individual fields)
    const {
      items,
      shippingAddress,
      billingAddress,
      shippingPrice,
      couponCode,
      paymentMethod,
      paymentProof,
      paymentProofUrl,
      // New format fields
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      postalCode,
      notes,
      couponDiscount,
      prepaidAmount,
      codAmount,
      shippingPaymentMethod
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required'
      });
    }

    // Build shipping address from either format
    let finalShippingAddress = shippingAddress;
    if (!finalShippingAddress && (customerName || address)) {
      finalShippingAddress = {
        name: customerName || '',
        phone: customerPhone || '',
        address: address || '',
        city: city || '',
        postalCode: postalCode || ''
      };
    }

    if (!finalShippingAddress || (!finalShippingAddress.address && !address)) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address is required'
      });
    }

    // Handle payment proof (from file upload)
    let paymentProofData = null;
    if (req.file) {
      paymentProofData = {
        data: req.file.buffer.toString('base64'),
        contentType: req.file.mimetype
      };
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required for each item'
        });
      }
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product ${item.productId} not found`
        });
      }

      const price = product.salePrice || product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: item.productId,
        name: product.name,
        price,
        quantity: item.quantity,
        size: item.selectedSize || item.size || null,
        color: item.selectedColor || item.color || null,
        image: product.images?.[0] || null
      });
    }

    // Apply coupon if provided
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid()) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.min(discount, subtotal);
      }
    }

    // Use couponDiscount from frontend if provided (already calculated)
    if (couponDiscount !== undefined && couponDiscount !== null) {
      discount = couponDiscount;
    }

    // Calculate total
    const total = subtotal + (shippingPrice || 0) - discount;

    // Map payment method from frontend format to backend format
    let finalPaymentMethod = paymentMethod || 'cash_on_delivery';
    if (finalPaymentMethod === 'cod') {
      finalPaymentMethod = 'cash_on_delivery';
    }
    // Keep instapay and vodafone as they are, don't convert to bank_transfer

    // Generate order number before creating
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${String(random).padStart(4, '0')}`;

    // Create order
    const order = await Order.create({
      orderNumber: orderNumber,
      user: req.user.userId,
      items: orderItems,
      shippingAddress: finalShippingAddress,
      billingAddress: billingAddress || finalShippingAddress,
      subtotal,
      shippingPrice: shippingPrice || 0,
      discount,
      coupon: coupon?._id,
      total,
      paymentMethod: finalPaymentMethod,
      shippingPaymentMethod: shippingPaymentMethod || null,
      paymentProof: paymentProofData,
      notes: notes || null
    });

    // Update coupon usage
    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save();
    }

    // Update product stock and check for low stock alerts
    for (const item of orderItems) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } },
        { new: true }
      );

      // Check for low stock alert (if stock is 5 or less)
      if (updatedProduct && updatedProduct.stockQuantity <= 5) {
        try {
          await sendLowStockAlert(updatedProduct, 'ar');
        } catch (alertError) {
          console.error('Error sending low stock alert:', alertError);
          // Don't fail the order creation if alert fails
        }
      }
    }

    // Send order notification email to admin (non-blocking)
    try {
      // Populate order with necessary data for notification
      const orderForNotification = {
        ...order.toObject(),
        currency: 'EGP', // Default currency, can be enhanced later
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      // Send notification asynchronously (don't wait for it)
      sendOrderNotification(orderForNotification, 'ar').catch(err => {
        console.error('Error sending order notification (non-blocking):', err);
      });
    } catch (notificationError) {
      console.error('Error preparing order notification (non-blocking):', notificationError);
      // Don't fail the order creation if notification fails
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const query = { user: req.user.userId };
    const { status } = req.query;

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    // Transform orders to match frontend format
    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.orderStatus || order.status || 'pending',
      total: order.total,
      items: order.items.map(item => ({
        id: item._id?.toString() || item.product?._id?.toString() || '',
        name: item.name || item.product?.name || '',
        nameAr: item.nameAr || item.product?.nameAr || '',
        quantity: item.quantity,
        price: item.price,
        image: item.image || (item.product?.images?.[0]?.url || (typeof item.product?.images?.[0] === 'string' ? item.product.images[0] : '') || '')
      })),
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber,
      orderReference: order.orderReference,
      customerName: order.shippingAddress?.name,
      customerPhone: order.shippingAddress?.phone,
      customerAddress: order.shippingAddress?.address,
      paymentMethod: order.paymentMethod,
      shippingPaymentMethod: order.shippingPaymentMethod || null,
      shippingPrice: order.shippingPrice,
      couponCode: order.coupon?.code,
      couponDiscount: order.discount
    }));

    res.json({
      success: true,
      orders: transformedOrders,
      data: { orders: transformedOrders } // Keep both formats for compatibility
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch orders'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user.userId
    }).populate('items.product', 'name images slug');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order'
    });
  }
};

// @desc    Track order
// @route   GET /api/orders/track/:orderNumber
// @access  Public
export const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .populate('items.product', 'name images')
      .select('-user');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track order'
    });
  }
};

// @desc    Track order by query parameters (tracking number or order number)
// @route   GET /api/account/track-order
// @access  Public
export const trackOrderByQuery = async (req, res) => {
  try {
    console.log('[trackOrderByQuery] Request received:', req.query);
    const { tracking, order: orderNumber } = req.query;

    // Build query - search by tracking number or order number
    const query = {};
    const searchTerms = [];
    const usedValues = new Set(); // To avoid duplicate search terms

    // Helper function to add search terms without duplicates
    const addSearchTerms = (value) => {
      if (!value || usedValues.has(value)) return;
      usedValues.add(value);

      const cleanValue = value.split(':')[0].trim();
      if (cleanValue !== value && !usedValues.has(cleanValue)) {
        usedValues.add(cleanValue);
        searchTerms.push(
          { trackingNumber: cleanValue },
          { orderNumber: cleanValue },
          { orderReference: cleanValue }
        );
      }

      searchTerms.push(
        { trackingNumber: value },
        { orderNumber: value },
        { orderReference: value }
      );
    };

    // Add search terms from both tracking and order parameters
    if (tracking) {
      addSearchTerms(tracking);
    }

    if (orderNumber) {
      addSearchTerms(orderNumber);
    }

    if (searchTerms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either tracking number or order number'
      });
    }

    // Use $or to search in all possible fields
    query.$or = searchTerms;

    const order = await Order.findOne(query)
      .populate('items.product', 'name nameAr images sku')
      .populate('user', 'email name')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Build timeline based on order status
    const statusTimeline = [
      {
        status: 'pending',
        description: 'Order Created',
        descriptionAr: 'تم إنشاء الطلب',
        timestamp: order.createdAt,
        completed: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'processing',
        description: 'Order Confirmed',
        descriptionAr: 'تم تأكيد الطلب',
        timestamp: order.orderStatus !== 'pending' ? order.updatedAt : null,
        completed: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'shipped',
        description: 'Order Shipped',
        descriptionAr: 'تم شحن الطلب',
        timestamp: ['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus) ? order.updatedAt : null,
        completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'out_for_delivery',
        description: 'Out for Delivery',
        descriptionAr: 'خرج للتوصيل',
        timestamp: ['out_for_delivery', 'delivered'].includes(order.orderStatus) ? order.updatedAt : null,
        completed: ['out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'delivered',
        description: 'Order Delivered',
        descriptionAr: 'تم التوصيل',
        timestamp: order.orderStatus === 'delivered' ? order.updatedAt : null,
        completed: order.orderStatus === 'delivered'
      }
    ];

    // Return formatted tracking info (matching frontend expectations)
    res.json({
      orderNumber: order.orderNumber,
      status: (order.orderStatus || 'pending').toLowerCase(),
      trackingNumber: order.trackingNumber || order.orderNumber,
      currentLocation: null, // Can be added later if needed
      currentLocationAr: null,
      estimatedDelivery: null, // Can be calculated based on shipping date
      timeline: statusTimeline,
      items: order.items || [],
      shippingAddress: order.shippingAddress || {},
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      shippingPrice: order.shippingPrice || 0
    });
  } catch (error) {
    console.error('Error in trackOrderByQuery:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track order'
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
};

// @desc    Get order invoice (PDF)
// @route   GET /api/account/orders/:id/invoice
// @access  Private
export const getOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    // Handle both full order ID and item-specific ID (format: orderId-itemIndex)
    const orderId = id.includes('-') ? id.split('-')[0] : id;
    const { lang = 'ar', format = 'pdf' } = req.query;

    // Find order - user can only access their own orders, admin can access any
    const order = await Order.findById(orderId)
      .populate('items.product', 'name nameAr images sku price salePrice')
      .populate('user', 'name email phone')
      .populate('coupon', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user is authorized (own order or admin)
    // Support both admin token (req.admin) and user token (req.user)
    const userInfo = req.admin || req.user;
    const isAdmin = userInfo?.role === 'admin' || userInfo?.type === 'admin';
    const isOwner = order.user?._id?.toString() === userInfo?.userId?.toString() ||
      order.user?._id?.toString() === userInfo?.id?.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access this order'
      });
    }

    // Generate PDF invoice using HTML template (same as old project)
    if (format === 'pdf') {
      try {
        // Get store settings for payment account details
        let storeSettings = null;
        try {
          const settingsDoc = await Settings.findOne({ key: 'store' });
          if (settingsDoc?.value) {
            const parsedSettings = typeof settingsDoc.value === 'string'
              ? JSON.parse(settingsDoc.value)
              : settingsDoc.value;
            storeSettings = {
              instaPayNumber: parsedSettings.instaPayNumber || '',
              instaPayAccountName: parsedSettings.instaPayAccountName || '',
              vodafoneNumber: parsedSettings.vodafoneNumber || ''
            };
          }
        } catch (error) {
          console.error('Error fetching store settings:', error);
        }

        // Get base URL for logo
        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        const baseUrl = `${protocol}://${host}`;

        // Try to load logo as base64
        let logoDataUrl = null;
        try {
          const fs = await import('fs');
          const path = await import('path');
          const logoPath = path.join(process.cwd(), 'uploads', 'logos', 'logo.png');
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoBase64 = logoBuffer.toString('base64');
            logoDataUrl = `data:image/png;base64,${logoBase64}`;
          }
        } catch (error) {
          console.error('Error loading logo file:', error);
        }

        // Prepare order data for template (matching old project format)
        const orderForTemplate = {
          orderNumber: order.orderNumber,
          orderReference: order.orderNumber,
          createdAt: order.createdAt,
          items: order.items,
          shippingAddress: order.shippingAddress,
          user: order.user,
          paymentMethod: order.paymentMethod,
          shippingPaymentMethod: order.shippingPaymentMethod || null,
          shippingPrice: order.shippingPrice,
          discount: order.discount,
          subtotal: order.subtotal,
          total: order.total,
          customerName: order.shippingAddress?.name || '',
          customerPhone: order.shippingAddress?.phone || '',
          customerAddress: order.shippingAddress?.address || '',
          customerEmail: order.user?.email || ''
        };

        // Generate HTML invoice using the same template as old project
        const invoiceHTML = generateInvoiceHTML(orderForTemplate, lang, userInfo, storeSettings, baseUrl, logoDataUrl);

        // Convert HTML to PDF using puppeteer
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
        });

        const page = await browser.newPage();
        await page.setContent(invoiceHTML, {
          waitUntil: 'networkidle0',
        });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm',
          },
          preferCSSPageSize: false,
        });

        await browser.close();

        // Set headers and send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}-${lang}.pdf"`);
        return res.send(Buffer.from(pdfBuffer));
      } catch (error) {
        console.error('Error generating PDF invoice:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF invoice: ' + (error.message || 'Unknown error')
        });
      }
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrderInvoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice'
    });
  }
};

// @desc    Update order (Admin) - PATCH endpoint
// @route   PATCH /api/admin/orders/:id
// @access  Private/Admin
export const updateAdminOrder = async (req, res) => {
  try {
    const { id } = req.params;
    // Handle both full order ID and item-specific ID (format: orderId-itemIndex)
    const orderId = id.includes('-') ? id.split('-')[0] : id;

    const { status, orderStatus, trackingNumber, cancellationReason } = req.body;

    // Use status or orderStatus (frontend might send either)
    const finalStatus = status || orderStatus;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Store old status for notification
    const oldStatus = order.orderStatus;

    // Update order status
    if (finalStatus) {
      let normalizedStatus = finalStatus.toLowerCase();

      // Map frontend status values to database enum values
      const statusMap = {
        'processing': 'confirmed', // Map PROCESSING to confirmed
      };

      // Apply mapping if needed
      if (statusMap[normalizedStatus]) {
        normalizedStatus = statusMap[normalizedStatus];
      }

      // Validate against enum values
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
      if (validStatuses.includes(normalizedStatus)) {
        order.orderStatus = normalizedStatus;
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid order status: ${finalStatus}. Valid values are: ${validStatuses.join(', ')}`
        });
      }
    }

    // Update tracking number
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    // Update cancellation reason if provided
    if (cancellationReason !== undefined) {
      order.cancelledReason = cancellationReason;
      if (cancellationReason) {
        order.cancelledAt = new Date();
      } else {
        order.cancelledAt = null;
      }
    }

    await order.save();

    // Send status update notification if status changed (non-blocking)
    if (finalStatus && oldStatus !== order.orderStatus) {
      try {
        const orderForNotification = {
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          trackingNumber: order.trackingNumber
        };

        sendOrderStatusUpdateNotification(orderForNotification, oldStatus, order.orderStatus, 'ar').catch(err => {
          console.error('Error sending order status update notification (non-blocking):', err);
        });
      } catch (notificationError) {
        console.error('Error preparing order status update notification (non-blocking):', notificationError);
        // Don't fail the order update if notification fails
      }
    }

    // Return the updated order in the format expected by frontend
    const updatedOrder = await Order.findById(orderId)
      .populate('items.product', 'name nameAr images sku price salePrice')
      .populate('user', 'name email phone')
      .populate('coupon', 'code discountType discountValue')
      .lean();

    // Transform to match frontend format (similar to getAdminOrders)
    const transformedOrder = {
      id: updatedOrder._id.toString(),
      orderReference: updatedOrder.orderNumber,
      orderNumber: updatedOrder.orderNumber,
      status: (updatedOrder.orderStatus || 'pending').toUpperCase(),
      total: updatedOrder.total,
      subtotal: updatedOrder.subtotal,
      shippingPrice: updatedOrder.shippingPrice || 0,
      discount: updatedOrder.discount || 0,
      trackingNumber: updatedOrder.trackingNumber || null,
      customerName: updatedOrder.shippingAddress?.name || '',
      customerPhone: updatedOrder.shippingAddress?.phone || '',
      customerEmail: updatedOrder.user?.email || '',
      customerAddress: updatedOrder.shippingAddress?.address || '',
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      paymentMethod: updatedOrder.paymentMethod || 'cash_on_delivery',
      shippingPaymentMethod: updatedOrder.shippingPaymentMethod || null,
      paymentStatus: updatedOrder.paymentStatus || 'pending',
      notes: updatedOrder.notes || null,
      couponCode: updatedOrder.coupon?.code || null
    };

    res.json({
      success: true,
      order: transformedOrder,
      data: { order: transformedOrder }
    });
  } catch (error) {
    console.error('Error in updateAdminOrder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order'
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const search = req.query.search;
    const date = req.query.date;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Status filter
    if (status && status !== 'all') {
      query.orderStatus = status.toLowerCase();
    }

    // Search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Date filter
    if (date && date !== 'all') {
      const now = new Date();
      let startDate;

      switch (date) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name nameAr images sku price salePrice')
        .populate('user', 'name email phone')
        .populate('coupon', 'code discountType discountValue')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    // Transform orders to match frontend format
    // The frontend expects each item in items array to be a separate order entry
    // So we flatten the order items into individual order entries
    const transformedOrders = [];

    orders.forEach(order => {
      const totalItems = order.items.length;
      // Calculate shipping and discount per item (for display, frontend will sum them)
      const shippingPerItem = totalItems > 0 ? (order.shippingPrice || 0) / totalItems : 0;
      const discountPerItem = totalItems > 0 ? (order.discount || 0) / totalItems : 0;

      // If order has multiple items, create an entry for each item
      order.items.forEach((item, itemIndex) => {
        const itemTotalPrice = (item.price || 0) * (item.quantity || 0);

        // Handle product images - support both array of objects and array of strings
        let productImages = [];
        if (item.product?.images) {
          if (Array.isArray(item.product.images)) {
            productImages = item.product.images.map(img => {
              if (typeof img === 'string') {
                return { url: img, alt: item.product?.name || '' };
              }
              return { url: img?.url || img, alt: img?.alt || item.product?.name || '' };
            });
          }
        } else if (item.image) {
          // Fallback to item.image if product.images is not available
          productImages = [{ url: item.image, alt: item.name || '' }];
        }

        // Create a separate order entry for each item
        transformedOrders.push({
          id: `${order._id.toString()}-${itemIndex}`, // Unique ID for each item
          orderReference: order.orderNumber,
          orderNumber: order.orderNumber,
          status: (order.orderStatus || 'pending').toUpperCase(),
          quantity: item.quantity || 0,
          totalPrice: itemTotalPrice,
          subtotal: itemTotalPrice,
          shippingPrice: shippingPerItem,
          discount: discountPerItem,
          couponDiscount: discountPerItem,
          couponCode: order.coupon?.code || null,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          trackingNumber: order.trackingNumber || null,
          customerName: order.shippingAddress?.name || '',
          customerPhone: order.shippingAddress?.phone || '',
          customerEmail: order.user?.email || '',
          customerAddress: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          postalCode: order.shippingAddress?.postalCode || '',
          paymentMethod: order.paymentMethod || 'cash_on_delivery',
          shippingPaymentMethod: order.shippingPaymentMethod || null,
          paymentStatus: order.paymentStatus || 'pending',
          paymentProof: order.paymentProof || null,
          // Send relative path for paymentProofUrl so Next.js rewrite can handle it
          // Extract relative path if paymentProof contains full URL
          paymentProofUrl: order.paymentProof
            ? (order.paymentProof.startsWith('http')
              ? order.paymentProof.replace(/^https?:\/\/[^\/]+/, '') // Extract path from full URL
              : order.paymentProof.startsWith('/')
                ? order.paymentProof
                : `/${order.paymentProof}`)
            : null,
          notes: order.notes || null,
          selectedSize: item.size || null,
          selectedColor: item.color || null,
          size: item.size || null,
          color: item.color || null,
          image: item.image || (productImages[0]?.url || ''),
          productId: item.product?._id?.toString() || '',
          product: item.product ? {
            id: item.product._id?.toString() || '',
            name: item.product.name || item.name || '',
            nameAr: item.product.nameAr || '',
            sku: item.product.sku || '',
            images: productImages
          } : {
            id: '',
            name: item.name || '',
            nameAr: '',
            sku: '',
            images: productImages
          }
        });
      });
    });

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getAdminOrders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch orders'
    });
  }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
export const getAdminOrdersStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all orders for today
    const todayOrders = await Order.find({
      createdAt: { $gte: today }
    });

    // Calculate today's revenue
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Get counts by status
    const [total, pending, confirmed, shipped, outForDelivery, delivered, cancelled] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.countDocuments({ orderStatus: 'confirmed' }),
      Order.countDocuments({ orderStatus: 'shipped' }),
      Order.countDocuments({ orderStatus: 'out_for_delivery' }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.countDocuments({ orderStatus: 'cancelled' })
    ]);

    const stats = {
      total,
      pending,
      confirmed,
      shipped,
      outForDelivery,
      delivered,
      cancelled,
      todayOrders: todayOrders.length,
      todayRevenue
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Error in getAdminOrdersStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order statistics'
    });
  }
};

