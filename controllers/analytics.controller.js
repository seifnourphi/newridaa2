import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

// Helper function to parse range to days
const parseRangeToDays = (range) => {
  if (!range) return 30;
  
  if (typeof range === 'string') {
    if (range.endsWith('d')) {
      return parseInt(range.replace('d', ''));
    }
    if (range.endsWith('w')) {
      return parseInt(range.replace('w', '')) * 7;
    }
    if (range.endsWith('m')) {
      return parseInt(range.replace('m', '')) * 30;
    }
  }
  
  return parseInt(range) || 30;
};

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
  try {
    const { days = 30, range } = req.query;
    const daysNum = range ? parseRangeToDays(range) : parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Calculate total views and clicks from products
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          totalClicks: { $sum: { $ifNull: ['$clicks', 0] } }
        }
      }
    ]);

    const totalViews = productStats[0]?.totalViews || 0;
    const totalWhatsappClicks = productStats[0]?.totalClicks || 0;
    const totalSearches = 0; // Can be implemented later with search tracking
    const conversionRate = totalViews > 0 
      ? ((totalWhatsappClicks / totalViews) * 100).toFixed(2)
      : '0.00';

    // Top products with views and clicks
    const topProducts = await Product.find({ isActive: true })
      .sort({ views: -1, clicks: -1 })
      .limit(10)
      .select('name nameAr sku views clicks')
      .lean();

    // Daily stats for the last N days (simplified - just return empty array for now)
    // Can be enhanced later with proper tracking
    const dailyStats = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        views: 0, // Can be implemented with proper tracking
        clicks: 0, // Can be implemented with proper tracking
        searches: 0
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalViews,
          totalWhatsappClicks,
          totalSearches,
          conversionRate
        },
        topProducts: topProducts.map(p => ({
          id: p._id.toString(),
          name: p.name,
          nameAr: p.nameAr || p.name,
          sku: p.sku || '',
          views: p.views || 0,
          whatsappClicks: p.clicks || 0
        })),
        dailyStats
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    });
  }
};

// @desc    Track analytics event (public endpoint for tracking product views, etc.)
// @route   POST /api/analytics
// @access  Public
export const trackAnalytics = async (req, res) => {
  try {
    const { event, entityId, productId, entityType, metadata } = req.body;

    // Validate required fields
    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Event is required'
      });
    }

    // Support both entityId and productId for backward compatibility
    const finalEntityId = entityId || productId;

    // If it's a product view event, increment product views count
    if ((event === 'PRODUCT_VIEW' || event === 'view_product') && finalEntityId) {
      try {
        await Product.findByIdAndUpdate(
          finalEntityId,
          { $inc: { views: 1 } },
          { new: false } // Don't return updated document, just increment
        );
      } catch (error) {
        console.error('Error incrementing product views:', error);
        // Don't fail the request if product update fails
      }
    }

    // Return success (non-blocking tracking)
    return res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Always return success to not break user experience
    return res.json({ success: true });
  }
};

// @desc    Get detailed analytics data (Admin)
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAdminAnalytics = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const daysNum = parseRangeToDays(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    startDate.setHours(0, 0, 0, 0);

    // Total revenue and orders
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalOrders = revenueStats[0]?.totalOrders || 0;
    const averageOrderValue = revenueStats[0]?.averageOrderValue || 0;

    // Previous period for growth calculation
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysNum);
    
    const previousRevenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: previousStartDate,
            $lt: startDate
          },
          orderStatus: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const previousRevenue = previousRevenueStats[0]?.totalRevenue || 0;
    const previousOrders = previousRevenueStats[0]?.totalOrders || 0;

    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
      : '0.00';
    const ordersGrowth = previousOrders > 0
      ? ((totalOrders - previousOrders) / previousOrders * 100).toFixed(2)
      : '0.00';

    // Product views and clicks
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          totalClicks: { $sum: { $ifNull: ['$clicks', 0] } }
        }
      }
    ]);

    const totalViews = productStats[0]?.totalViews || 0;
    const totalWhatsappClicks = productStats[0]?.totalClicks || 0;
    const conversionRate = totalViews > 0
      ? ((totalWhatsappClicks / totalViews) * 100).toFixed(2)
      : '0.00';

    // Top products with orders and revenue
    const topProductsData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          orders: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    const topProductIds = topProductsData.map(p => p._id);
    const topProducts = await Product.find({ _id: { $in: topProductIds } })
      .select('name nameAr sku views clicks')
      .lean();

    const topProductsWithStats = topProducts.map(product => {
      const stats = topProductsData.find(s => s._id.toString() === product._id.toString());
      return {
        id: product._id.toString(),
        name: product.name,
        nameAr: product.nameAr || product.name,
        sku: product.sku || '',
        views: product.views || 0,
        whatsappClicks: product.clicks || 0,
        orders: stats?.orders || 0,
        revenue: stats?.revenue || 0,
        conversionRate: (product.views || 0) > 0
          ? (((stats?.orders || 0) / (product.views || 1)) * 100).toFixed(2)
          : '0.00'
      };
    });

    // Recent orders
    const recentOrders = await Order.find({
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name nameAr')
      .lean();

    const normalizedRecentOrders = recentOrders.map(order => ({
      id: order._id.toString(),
      orderReference: order.orderNumber || order._id.toString(),
      customerName: order.user?.name || 'Guest',
      totalPrice: order.total || 0,
      status: order.orderStatus || 'pending',
      createdAt: order.createdAt ? order.createdAt.toISOString() : null,
      product: order.items?.[0]?.product ? {
        name: order.items[0].product.name || order.items[0].product.name || '',
        nameAr: order.items[0].product.nameAr || order.items[0].product.name || ''
      } : null
    }));

    // Daily stats
    const dailyStats = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayStats = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: date,
              $lt: nextDate
            },
            orderStatus: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        }
      ]);

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        revenue: dayStats[0]?.revenue || 0,
        orders: dayStats[0]?.orders || 0,
        views: 0, // Can be implemented with proper tracking
        clicks: 0 // Can be implemented with proper tracking
      });
    }

    // Top countries (simplified - can be enhanced)
    // Note: Order model may not have country field, return empty array for now
    const normalizedTopCountries = [];

    // Device stats (simplified - can be enhanced with proper tracking)
    const deviceStats = {
      mobile: 0,
      desktop: 0,
      tablet: 0
    };

    res.json({
      success: true,
      data: {
        analytics: {
          summary: {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalOrders,
            totalViews,
            totalWhatsappClicks: parseInt(totalWhatsappClicks),
            conversionRate: parseFloat(conversionRate),
            averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
            revenueGrowth: parseFloat(revenueGrowth),
            ordersGrowth: parseFloat(ordersGrowth)
          },
          topProducts: topProductsWithStats,
          recentOrders: normalizedRecentOrders,
          dailyStats,
          topCountries: normalizedTopCountries,
          deviceStats
        }
      }
    });
  } catch (error) {
    console.error('Admin Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    });
  }
};

