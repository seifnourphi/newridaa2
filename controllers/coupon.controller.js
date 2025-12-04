import Coupon from '../models/Coupon.model.js';

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Coupon is expired or has reached usage limit'
      });
    }

    if (subtotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase of ${coupon.minPurchase} required`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, subtotal);

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          descriptionAr: coupon.descriptionAr,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discount,
        finalAmount: subtotal - discount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate coupon'
    });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch coupons'
    });
  }
};

// @desc    Get all coupons (Admin - formatted for admin panel)
// @route   GET /api/admin/coupons
// @access  Private/Admin
export const getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

    // Normalize coupons for admin panel
    const normalized = coupons.map(coupon => ({
      id: coupon._id.toString(),
      code: coupon.code,
      name: coupon.name || null,
      description: coupon.description || null,
      discountType: coupon.discountType === 'percentage' ? 'PERCENTAGE' : (coupon.discountType === 'fixed' ? 'FIXED' : 'PERCENTAGE'),
      discountValue: coupon.discountValue || 0,
      minOrderAmount: coupon.minPurchase || null,
      maxUses: coupon.usageLimit || null,
      usedCount: coupon.usedCount || 0,
      isActive: coupon.isActive !== false,
      startDate: coupon.validFrom ? coupon.validFrom.toISOString() : null,
      endDate: coupon.validUntil ? coupon.validUntil.toISOString() : null,
      createdAt: coupon.createdAt ? coupon.createdAt.toISOString() : null,
      updatedAt: coupon.updatedAt ? coupon.updatedAt.toISOString() : null
    }));

    res.json({
      success: true,
      data: {
        coupons: normalized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch coupons'
    });
  }
};

// @desc    Get single coupon
// @route   GET /api/admin/coupons/:id
// @access  Private/Admin
export const getCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id).lean();

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Normalize coupon
    const normalized = {
      id: coupon._id.toString(),
      code: coupon.code,
      name: coupon.name || null,
      description: coupon.description || null,
      discountType: coupon.discountType === 'percentage' ? 'PERCENTAGE' : (coupon.discountType === 'fixed' ? 'FIXED' : 'PERCENTAGE'),
      discountValue: coupon.discountValue || 0,
      minOrderAmount: coupon.minPurchase || null,
      maxUses: coupon.usageLimit || null,
      usedCount: coupon.usedCount || 0,
      isActive: coupon.isActive !== false,
      startDate: coupon.validFrom ? coupon.validFrom.toISOString() : null,
      endDate: coupon.validUntil ? coupon.validUntil.toISOString() : null,
      createdAt: coupon.createdAt ? coupon.createdAt.toISOString() : null,
      updatedAt: coupon.updatedAt ? coupon.updatedAt.toISOString() : null
    };

    res.json({
      success: true,
      data: {
        coupon: normalized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch coupon'
    });
  }
};

// @desc    Create coupon (Admin)
// @route   POST /api/admin/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      isActive,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Code, discount type, and discount value are required'
      });
    }

    // Convert discountType from PERCENTAGE/FIXED to percentage/fixed
    let normalizedDiscountType = discountType.toLowerCase();
    if (normalizedDiscountType === 'percentage') {
      normalizedDiscountType = 'percentage';
    } else if (normalizedDiscountType === 'fixed') {
      normalizedDiscountType = 'fixed';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid discount type. Must be PERCENTAGE or FIXED'
      });
    }

    // Validate discount value
    if (normalizedDiscountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Percentage discount must be between 0 and 100'
      });
    }

    if (normalizedDiscountType === 'fixed' && discountValue < 0) {
      return res.status(400).json({
        success: false,
        error: 'Fixed discount must be greater than 0'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code already exists'
      });
    }

    // Prepare coupon data - convert frontend format to model format
    const couponData = {
      code: code.toUpperCase().trim(),
      name: name || null,
      description: description || null,
      discountType: normalizedDiscountType,
      discountValue: Number(discountValue),
      minPurchase: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscount: null, // Not used in frontend, can be added later
      usageLimit: maxUses ? Number(maxUses) : null,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true,
      validFrom: startDate ? new Date(startDate) : new Date(), // Default to now if not provided
      validUntil: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now if not provided
    };

    const coupon = await Coupon.create(couponData);

    // Normalize response for frontend
    const normalized = {
      id: coupon._id.toString(),
      code: coupon.code,
      name: coupon.name || null,
      description: coupon.description || null,
      discountType: coupon.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
      discountValue: coupon.discountValue || 0,
      minOrderAmount: coupon.minPurchase || null,
      maxUses: coupon.usageLimit || null,
      usedCount: coupon.usedCount || 0,
      isActive: coupon.isActive !== false,
      startDate: coupon.validFrom ? coupon.validFrom.toISOString() : null,
      endDate: coupon.validUntil ? coupon.validUntil.toISOString() : null,
      createdAt: coupon.createdAt ? coupon.createdAt.toISOString() : null,
      updatedAt: coupon.updatedAt ? coupon.updatedAt.toISOString() : null
    };

    res.status(201).json({
      success: true,
      data: {
        coupon: normalized
      }
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create coupon'
    });
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      isActive,
      startDate,
      endDate,
    } = req.body;

    // Find existing coupon
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Prepare update data - convert frontend format to model format
    const updateData = {};

    if (code !== undefined) {
      // Check if new code already exists (and is different from current)
      if (code.toUpperCase().trim() !== existingCoupon.code) {
        const codeExists = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (codeExists) {
          return res.status(400).json({
            success: false,
            error: 'Coupon code already exists'
          });
        }
      }
      updateData.code = code.toUpperCase().trim();
    }

    if (name !== undefined) updateData.name = name || null;
    if (description !== undefined) updateData.description = description || null;

    if (discountType !== undefined) {
      let normalizedDiscountType = discountType.toLowerCase();
      if (normalizedDiscountType === 'percentage') {
        normalizedDiscountType = 'percentage';
      } else if (normalizedDiscountType === 'fixed') {
        normalizedDiscountType = 'fixed';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid discount type. Must be PERCENTAGE or FIXED'
        });
      }
      updateData.discountType = normalizedDiscountType;
    }

    if (discountValue !== undefined) {
      const value = Number(discountValue);
      const finalDiscountType = updateData.discountType || existingCoupon.discountType;
      
      if (finalDiscountType === 'percentage' && (value < 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Percentage discount must be between 0 and 100'
        });
      }
      if (finalDiscountType === 'fixed' && value < 0) {
        return res.status(400).json({
          success: false,
          error: 'Fixed discount must be greater than 0'
        });
      }
      updateData.discountValue = value;
    }

    if (minOrderAmount !== undefined) {
      updateData.minPurchase = minOrderAmount ? Number(minOrderAmount) : 0;
    }

    if (maxUses !== undefined) {
      updateData.usageLimit = maxUses ? Number(maxUses) : null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (startDate !== undefined) {
      updateData.validFrom = startDate ? new Date(startDate) : new Date();
    }

    if (endDate !== undefined) {
      updateData.validUntil = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Normalize response for frontend
    const normalized = {
      id: coupon._id.toString(),
      code: coupon.code,
      name: coupon.name || null,
      description: coupon.description || null,
      discountType: coupon.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
      discountValue: coupon.discountValue || 0,
      minOrderAmount: coupon.minPurchase || null,
      maxUses: coupon.usageLimit || null,
      usedCount: coupon.usedCount || 0,
      isActive: coupon.isActive !== false,
      startDate: coupon.validFrom ? coupon.validFrom.toISOString() : null,
      endDate: coupon.validUntil ? coupon.validUntil.toISOString() : null,
      createdAt: coupon.createdAt ? coupon.createdAt.toISOString() : null,
      updatedAt: coupon.updatedAt ? coupon.updatedAt.toISOString() : null
    };

    res.json({
      success: true,
      data: {
        coupon: normalized
      }
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update coupon'
    });
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete coupon'
    });
  }
};

