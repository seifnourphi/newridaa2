import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import { sendLowStockAlert } from '../utils/notification.util.js';
import { handleDbError, isDbConnected } from '../utils/db.util.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      new: isNew,
      bestseller,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (isNew === 'true') {
      query.isNew = true;
    }

    if (bestseller === 'true') {
      query.isBestseller = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Check database connection before querying
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.',
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
    }

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name nameAr slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch products');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const identifier = id || slug;

    // Validate identifier
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product identifier'
      });
    }

    // Check if it's a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    let product;
    if (isObjectId) {
      // Search by ID (for admin routes)
      product = await Product.findById(identifier)
        .populate({
          path: 'category',
          select: 'name nameAr slug',
          options: { lean: true } // Handle missing category gracefully
        })
        .lean(); // Use lean() for better performance
    } else {
      // Search by slug (for public routes)
      product = await Product.findOne({ slug: identifier, isActive: true })
        .populate({
          path: 'category',
          select: 'name nameAr slug',
          options: { lean: true } // Handle missing category gracefully
        })
        .lean(); // Use lean() for better performance
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Increment views only for public routes (not admin)
    // Note: We need to fetch the product again without lean() to save it
    if (!isObjectId && product && product.isActive) {
      try {
        await Product.findOneAndUpdate(
          { slug: identifier },
          { $inc: { views: 1 } }
        );
      } catch (viewError) {
        // Log but don't fail the request if view increment fails
        console.error('Failed to increment product views:', viewError);
      }
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch product');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product'
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Remove csrfToken if present (it's not a product field)
    if (productData.csrfToken) {
      delete productData.csrfToken;
    }

    // Convert categoryId to category if present
    if (productData.categoryId && !productData.category) {
      productData.category = productData.categoryId;
      delete productData.categoryId;
    }

    // Handle images from upload
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: productData.name,
        altAr: productData.nameAr
      }));
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Prepare update data (only include fields that are provided)
    const updateData = { ...req.body };

    // Remove csrfToken if present (it's not a product field)
    if (updateData.csrfToken) {
      delete updateData.csrfToken;
    }

    // Handle new images (only if files are uploaded)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: req.body.name || product.name,
        altAr: req.body.nameAr || product.nameAr
      }));
      updateData.images = [...(product.images || []), ...newImages];
    }

    // For PATCH requests, only update provided fields
    // For PUT requests, update all fields
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        // Only validate fields that are being updated
        setDefaultsOnInsert: false
      }
    );

    // Check for low stock alert if stockQuantity was updated and is 5 or less
    if (updatedProduct && updateData.stockQuantity !== undefined) {
      if (updatedProduct.stockQuantity <= 5) {
        try {
          await sendLowStockAlert(updatedProduct, 'ar');
        } catch (alertError) {
          console.error('Error sending low stock alert:', alertError);
          // Don't fail the product update if alert fails
        }
      }
    }

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // Optional: ?hardDelete=true for permanent deletion

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Always hard delete (permanently delete from database)
    await Product.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Product permanently deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete product'
    });
  }
};

// @desc    Get all products (Admin - includes inactive)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAdminProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      featured,
      new: isNew,
      bestseller,
      search,
      status,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query (no isActive filter for admin)
    const query = {};

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (isNew === 'true') {
      query.isNew = true;
    }

    if (bestseller === 'true') {
      query.isBestseller = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name nameAr slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);

    // Normalize products
    const normalized = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      nameAr: product.nameAr || product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      salePrice: product.salePrice,
      discountPercent: product.salePrice && product.price
        ? Math.round(((product.price - product.salePrice) / product.price) * 100)
        : 0,
      stockQuantity: product.stockQuantity || 0,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestseller: product.isBestseller,
      views: product.views || 0,
      whatsappClicks: product.clicks || 0,
      category: product.category ? {
        id: product.category._id.toString(),
        name: product.category.name,
        nameAr: product.category.nameAr || product.category.name
      } : null,
      images: product.images || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    res.json({
      success: true,
      data: {
        products: normalized
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
};

// @desc    Get products statistics
// @route   GET /api/admin/products/stats
// @access  Private/Admin
export const getProductsStats = async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const active = await Product.countDocuments({ isActive: true });
    const outOfStock = await Product.countDocuments({ stockQuantity: { $lte: 0 } });
    const featured = await Product.countDocuments({ isFeatured: true });

    res.json({
      success: true,
      data: {
        stats: {
          total,
          active,
          outOfStock,
          featured
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products stats'
    });
  }
};

