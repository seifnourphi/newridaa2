import User from '../models/User.model.js';

// @desc    Get user profile
// @route   GET /api/account/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Split name into firstName and lastName
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Get default address or first address
    const defaultAddress = user.addresses && user.addresses.length > 0 
      ? (user.addresses.find(addr => addr.isDefault) || user.addresses[0])
      : null;
    
    // Convert address object to string for frontend compatibility
    const addressString = defaultAddress 
      ? (defaultAddress.address || '')
      : '';

    // If user is active but emailVerified is false, update it to true
    // This handles existing users who were created before email verification was implemented
    let emailVerified = user.emailVerified || false;
    if (user.isActive && !emailVerified) {
      try {
        user.emailVerified = true;
        await user.save();
        emailVerified = true;
        console.log(`✅ Updated emailVerified to true for user ${user.email}`);
      } catch (updateError) {
        console.warn('❌ Failed to update emailVerified status:', updateError);
        // Even if update fails, set it to true in response since user is logged in
        emailVerified = true;
      }
    }
    
    // Ensure emailVerified is always true in response if user is logged in
    if (!emailVerified && user.isActive) {
      emailVerified = true;
    }

    res.json({
      success: true,
      data: {
        profile: {
          firstName,
          lastName,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: addressString, // Return as string for frontend
          addressObject: defaultAddress, // Also return full object if needed
          addresses: user.addresses || [],
          subscribedToNewsletter: user.subscribedToNewsletter !== undefined ? user.subscribedToNewsletter : false,
          avatar: user.avatar || null,
          emailVerified: emailVerified, // Always include emailVerified
          mfaEnabled: user.mfaEnabled || false // Include MFA status
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile'
    });
  }
};

// @desc    Update user profile
// @route   PATCH /api/account/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, subscribedToNewsletter } = req.body;

    console.log('Update profile request:', {
      firstName,
      lastName,
      phone,
      address: address,
      addressType: typeof address,
      isAddressString: typeof address === 'string',
      isAddressObject: typeof address === 'object' && address !== null,
      subscribedToNewsletter
    });

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update name if firstName or lastName provided
    if (firstName !== undefined || lastName !== undefined) {
      const currentNameParts = (user.name || '').split(' ');
      const currentFirstName = currentNameParts[0] || '';
      const currentLastName = currentNameParts.slice(1).join(' ') || '';
      
      // Use new values if provided and not empty, otherwise keep current values
      const newFirstName = (firstName !== undefined && firstName !== null && String(firstName).trim() !== '') 
        ? String(firstName).trim() 
        : currentFirstName;
      const newLastName = (lastName !== undefined && lastName !== null && String(lastName).trim() !== '') 
        ? String(lastName).trim() 
        : currentLastName;
      
      // Validate name length (professional limit: 25 characters per part)
      if (newFirstName.length > 25) {
        return res.status(400).json({
          success: false,
          error: 'First name must not exceed 25 characters'
        });
      }
      
      if (newLastName.length > 25) {
        return res.status(400).json({
          success: false,
          error: 'Last name must not exceed 25 characters'
        });
      }
      
      // Combine firstName and lastName
      const combinedName = `${newFirstName} ${newLastName}`.trim();
      
      // Validate total name length
      if (combinedName.length > 60) {
        return res.status(400).json({
          success: false,
          error: 'Full name must not exceed 60 characters'
        });
      }
      
      if (combinedName) {
        user.name = combinedName;
        console.log('Updated name:', user.name);
      } else {
        console.log('Name update skipped - both firstName and lastName are empty');
      }
    }

    // Update phone
    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : '';
    }

    // Update address
    if (address !== undefined) {
      if (!user.addresses) {
        user.addresses = [];
      }

      if (address && typeof address === 'object' && address !== null) {
        // If address is an object, update or add it
        const existingIndex = user.addresses.findIndex(addr => addr.isDefault);
        
        if (existingIndex >= 0) {
          // Update existing default address
          user.addresses[existingIndex] = {
            ...user.addresses[existingIndex],
            ...address,
            isDefault: true
          };
        } else {
          // Add new address as default
          user.addresses.push({
            ...address,
            isDefault: true
          });
        }
      } else if (typeof address === 'string' && address.trim() !== '') {
        // If address is a string, convert it to address object
        const existingIndex = user.addresses.findIndex(addr => addr.isDefault);
        const addressObj = {
          name: user.name || '',
          phone: user.phone || '',
          address: address.trim(),
          city: '',
          postalCode: '',
          isDefault: true
        };
        
        console.log('Converting string address to object:', addressObj);
        
        if (existingIndex >= 0) {
          // Update existing default address
          user.addresses[existingIndex] = {
            ...user.addresses[existingIndex],
            ...addressObj
          };
          console.log('Updated existing address at index:', existingIndex);
        } else {
          // Add new address as default
          user.addresses.push(addressObj);
          console.log('Added new address');
        }
      } else if (address === null || address === '' || (typeof address === 'string' && address.trim() === '')) {
        // Clear addresses if address is null or empty
        console.log('Clearing addresses - address is empty');
        user.addresses = [];
      }
    }

    // Update newsletter subscription
    if (subscribedToNewsletter !== undefined) {
      user.subscribedToNewsletter = subscribedToNewsletter === true;
    }

    await user.save();
    
    // Log saved addresses for debugging
    console.log('User addresses after save:', JSON.stringify(user.addresses, null, 2));

    // Split name for response
    const nameParts = (user.name || '').split(' ');
    const responseFirstName = nameParts[0] || '';
    const responseLastName = nameParts.slice(1).join(' ') || '';

    // Get default address or first address
    const defaultAddress = user.addresses && user.addresses.length > 0 
      ? (user.addresses.find(addr => addr.isDefault) || user.addresses[0])
      : null;
    
    // Convert address object to string for frontend compatibility
    const addressString = defaultAddress 
      ? (defaultAddress.address || '')
      : '';

    // Ensure emailVerified is included in response
    const emailVerified = user.emailVerified !== undefined ? user.emailVerified : (user.isActive ? true : false);

    res.json({
      success: true,
      data: {
        profile: {
          firstName: responseFirstName,
          lastName: responseLastName,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: addressString, // Return as string for frontend
          addressObject: defaultAddress, // Also return full object if needed
          addresses: user.addresses || [],
          subscribedToNewsletter: user.subscribedToNewsletter !== undefined ? user.subscribedToNewsletter : false,
          avatar: user.avatar || null,
          emailVerified: emailVerified // Always include emailVerified
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile'
    });
  }
};

// @desc    Upload user avatar
// @route   POST /api/account/profile/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get the file path and create URL
    const filePath = req.file.path;
    const uploadsDir = filePath.includes('avatars') ? '/uploads/avatars' : '/uploads';
    const avatarUrl = `${uploadsDir}/${req.file.filename}`;

    // Update user avatar
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      avatarUrl: avatarUrl,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload avatar'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/account/delete-account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Find user with password field
    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password'
      });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.userId);

    // Clear the token cookie
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
    });
  }
};

