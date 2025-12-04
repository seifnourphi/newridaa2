import User from '../models/User.model.js';

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAdminUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      verified,
      newsletter,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Note: emailVerified and subscribedToNewsletter may not exist in User model
    // These filters will be applied in the normalization step if needed

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
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
    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(query);

    // Normalize users for admin panel
    const normalized = users.map(user => {
      // Split name into firstName and lastName if needed
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: user._id.toString(),
        firstName,
        lastName,
        name: user.name || '',
        email: user.email,
        phone: user.phone || null,
        emailVerified: user.emailVerified !== undefined ? user.emailVerified : true, // Default to true if not set
        isActive: user.isActive !== false,
        subscribedToNewsletter: user.subscribedToNewsletter !== undefined ? user.subscribedToNewsletter : false, // Default to false if not set
        avatar: user.avatar || null,
        role: user.role || 'user',
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
      };
    });

    res.json({
      success: true,
      data: {
        users: normalized
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
      error: error.message || 'Failed to fetch users'
    });
  }
};

// @desc    Get single user (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Normalize user
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const normalized = {
      id: user._id.toString(),
      firstName,
      lastName,
      name: user.name || '',
      email: user.email,
      phone: user.phone || null,
      emailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
      isActive: user.isActive !== false,
      subscribedToNewsletter: user.subscribedToNewsletter !== undefined ? user.subscribedToNewsletter : false,
      avatar: user.avatar || null,
      role: user.role || 'user',
      addresses: user.addresses || [],
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
    };

    res.json({
      success: true,
      data: {
        user: normalized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user'
    });
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove csrfToken from body before updating (it's only for CSRF verification)
    const { csrfToken, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          firstName,
          lastName,
          name: user.name || '',
          email: user.email,
          phone: user.phone || null,
          emailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
          isActive: user.isActive !== false,
          subscribedToNewsletter: user.subscribedToNewsletter !== undefined ? user.subscribedToNewsletter : false,
          avatar: user.avatar || null,
          role: user.role || 'user',
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
          updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user'
    });
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
};

