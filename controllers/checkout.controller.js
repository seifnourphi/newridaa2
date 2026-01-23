import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';

// @desc    Validate coupon for checkout
// @route   POST /api/checkout/validate-coupon
// @access  Public
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.json({
        valid: false,
        error: 'Coupon code is required'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.json({
        valid: false,
        error: 'Coupon not found'
      });
    }

    if (!coupon.isValid()) {
      return res.json({
        valid: false,
        error: 'Coupon is expired or has reached usage limit'
      });
    }

    // Use orderAmount if provided, otherwise skip minPurchase check
    if (orderAmount && coupon.minPurchase && orderAmount < coupon.minPurchase) {
      return res.json({
        valid: false,
        error: `Minimum purchase of ${coupon.minPurchase} required`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = orderAmount ? (orderAmount * coupon.discountValue) / 100 : 0;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    if (orderAmount) {
      discount = Math.min(discount, orderAmount);
    }

    // Normalize discountType for frontend (PERCENTAGE/FIXED instead of percentage/fixed)
    const normalizedDiscountType = coupon.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED';

    res.json({
      valid: true,
      coupon: {
        id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        descriptionAr: coupon.descriptionAr,
        discountType: normalizedDiscountType,
        discountValue: coupon.discountValue,
        discountAmount: discount, // Add calculated discount amount to coupon object
        maxDiscount: coupon.maxDiscount,
        minPurchase: coupon.minPurchase
      },
      discount,
      finalAmount: orderAmount ? orderAmount - discount : 0
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.json({
      valid: false,
      error: error.message || 'Failed to validate coupon'
    });
  }
};

// @desc    Upload payment proof
// @route   POST /api/checkout/upload-payment-proof
// @access  Private
export const uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Extract relative path from absolute path
    const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
    const fileUrl = `/uploads${relativePath}`;

    // Return the file URL
    const paymentProof = {
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    res.json({
      success: true,
      paymentProof,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload payment proof'
    });
  }
};

// @desc    Validate stock for checkout items
// @route   POST /api/checkout/validate-stock
// @access  Public (for guest checkout)
export const validateStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Items are required',
        message: 'No items provided for validation'
      });
    }

    const validationResults = [];
    let allValid = true;

    for (const item of items) {
      const { productId, quantity, selectedSize, selectedColor } = item;

      if (!productId) {
        validationResults.push({
          productId: productId || 'unknown',
          valid: false,
          error: 'Product ID is required'
        });
        allValid = false;
        continue;
      }

      if (!quantity || quantity < 1) {
        validationResults.push({
          productId,
          valid: false,
          error: 'Quantity must be at least 1'
        });
        allValid = false;
        continue;
      }

      // Find product
      const product = await Product.findById(productId);

      if (!product) {
        validationResults.push({
          productId,
          valid: false,
          error: 'Product not found'
        });
        allValid = false;
        continue;
      }

      if (!product.isActive) {
        validationResults.push({
          productId,
          valid: false,
          error: 'Product is not available'
        });
        allValid = false;
        continue;
      }

      // Check stock based on variants
      let availableStock = product.stockQuantity || 0;

      // If product has variant combinations
      if (product.variantCombinations && product.variantCombinations.length > 0) {
        const matchingCombination = product.variantCombinations.find(combo => {
          const sizeMatch = !selectedSize || combo.size === selectedSize;
          const colorMatch = !selectedColor || combo.color === selectedColor;
          return sizeMatch && colorMatch;
        });

        if (matchingCombination) {
          availableStock = matchingCombination.stock || 0;
        } else if (selectedSize || selectedColor) {
          // If specific variant requested but not found
          validationResults.push({
            productId,
            valid: false,
            error: 'Selected variant not available'
          });
          allValid = false;
          continue;
        }
      } else if (product.variants && product.variants.length > 0) {
        // Check individual variants
        if (selectedSize) {
          const sizeVariant = product.variants.find(v => v.type === 'SIZE' && v.value === selectedSize);
          if (sizeVariant && sizeVariant.stock !== undefined) {
            availableStock = sizeVariant.stock;
          }
        }

        if (selectedColor) {
          const colorVariant = product.variants.find(v => v.type === 'COLOR' && v.value === selectedColor);
          if (colorVariant && colorVariant.stock !== undefined) {
            availableStock = Math.min(availableStock, colorVariant.stock);
          }
        }
      }

      // Check if requested quantity is available
      if (availableStock < quantity) {
        validationResults.push({
          productId,
          valid: false,
          error: `Only ${availableStock} items available in stock`,
          availableStock,
          requestedQuantity: quantity
        });
        allValid = false;
      } else {
        validationResults.push({
          productId,
          valid: true,
          availableStock,
          requestedQuantity: quantity
        });
      }
    }

    res.json({
      success: true,
      valid: allValid,
      results: validationResults,
      message: allValid
        ? 'All items are available in stock'
        : 'Some items are not available in the requested quantity'
    });
  } catch (error) {
    console.error('Stock validation error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: error.message || 'Failed to validate stock',
      message: 'An error occurred while validating stock'
    });
  }
};

