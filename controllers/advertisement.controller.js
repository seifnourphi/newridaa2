import Advertisement from '../models/Advertisement.model.js';
import { handleDbError, isDbConnected } from '../utils/db.util.js';

// @desc    Get all advertisements
// @route   GET /api/advertisements
// @access  Public
export const getAdvertisements = async (req, res) => {
  try {
    // Check database connection before querying
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable. Please try again later.',
        advertisements: [],
        data: { advertisements: [] }
      });
    }

    const advertisements = await Advertisement.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const normalized = advertisements.map(ad => ({
      id: ad._id.toString(),
      title: ad.title || '',
      titleAr: ad.titleAr || ad.title || '',
      subtitle: ad.subtitle || '',
      subtitleAr: ad.subtitleAr || ad.subtitle || '',
      badge: ad.badge || '',
      badgeAr: ad.badgeAr || ad.badge || '',
      badgeColor: ad.badgeColor || '#DAA520',
      description: ad.description || '',
      descriptionAr: ad.descriptionAr || ad.description || '',
      buttonText: ad.buttonText || '',
      buttonTextAr: ad.buttonTextAr || ad.buttonText || '',
      image: ad.image || '',
      price: ad.price || null,
      originalPrice: ad.originalPrice || null,
      displayType: ad.displayType || 'SINGLE',
      sortOrder: ad.sortOrder || 0,
      isActive: ad.isActive !== false,
      images: ad.images || [],
      highlightedWord: ad.highlightedWord || '',
      highlightedWordAr: ad.highlightedWordAr || '',
      highlightedWordColor: ad.highlightedWordColor || '',
      highlightedWordUnderline: ad.highlightedWordUnderline || false,
      showDiscountBadge: ad.showDiscountBadge !== false,
      discountBadgePosition: ad.discountBadgePosition || 'top-right',
      promotionalBadges: ad.promotionalBadges || [],
      buttons: ad.buttons || [],
      createdAt: ad.createdAt ? ad.createdAt.toISOString() : null,
      updatedAt: ad.updatedAt ? ad.updatedAt.toISOString() : null
    }));

    res.json({
      success: true,
      advertisements: normalized,
      data: {
        advertisements: normalized
      }
    });
  } catch (error) {
    const dbErrorResponse = handleDbError(error, res, 'Failed to fetch advertisements');
    if (dbErrorResponse) return dbErrorResponse;
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch advertisements'
    });
  }
};

// @desc    Get all advertisements (Admin - includes inactive)
// @route   GET /api/admin/advertisements
// @access  Private/Admin
export const getAdminAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    console.log(`[Admin API] Found ${advertisements.length} advertisements in database`);
    
    const normalized = advertisements.map(ad => ({
      id: ad._id.toString(),
      title: ad.title || '',
      titleAr: ad.titleAr || ad.title || '',
      subtitle: ad.subtitle || '',
      subtitleAr: ad.subtitleAr || ad.subtitle || '',
      badge: ad.badge || '',
      badgeAr: ad.badgeAr || ad.badge || '',
      badgeColor: ad.badgeColor || '#DAA520',
      description: ad.description || '',
      descriptionAr: ad.descriptionAr || ad.description || '',
      buttonText: ad.buttonText || '',
      buttonTextAr: ad.buttonTextAr || ad.buttonText || '',
      image: ad.image || '',
      price: ad.price || null,
      originalPrice: ad.originalPrice || null,
      displayType: ad.displayType || 'SINGLE',
      sortOrder: ad.sortOrder || 0,
      isActive: ad.isActive !== false,
      images: ad.images || [],
      highlightedWord: ad.highlightedWord || '',
      highlightedWordAr: ad.highlightedWordAr || '',
      highlightedWordColor: ad.highlightedWordColor || '',
      highlightedWordUnderline: ad.highlightedWordUnderline || false,
      showDiscountBadge: ad.showDiscountBadge !== false,
      discountBadgePosition: ad.discountBadgePosition || 'top-right',
      features: ad.features || [],
      testimonialText: ad.testimonialText || '',
      testimonialTextAr: ad.testimonialTextAr || '',
      testimonialAuthor: ad.testimonialAuthor || '',
      testimonialAuthorAr: ad.testimonialAuthorAr || '',
      promotionalBadges: ad.promotionalBadges || [],
      buttons: ad.buttons || [],
      createdAt: ad.createdAt ? ad.createdAt.toISOString() : null,
      updatedAt: ad.updatedAt ? ad.updatedAt.toISOString() : null
    }));

    console.log(`[Admin API] Returning ${normalized.length} normalized advertisements`);
    console.log(`[Admin API] Advertisement titles:`, normalized.map(a => a.title));

    res.json({
      success: true,
      data: {
        advertisements: normalized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch advertisements'
    });
  }
};

// @desc    Get single advertisement
// @route   GET /api/admin/advertisements/:id
// @access  Private/Admin
export const getAdminAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findById(id).lean();

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        error: 'Advertisement not found'
      });
    }

    const normalized = {
      id: advertisement._id.toString(),
      title: advertisement.title || '',
      titleAr: advertisement.titleAr || advertisement.title || '',
      subtitle: advertisement.subtitle || '',
      subtitleAr: advertisement.subtitleAr || advertisement.subtitle || '',
      badge: advertisement.badge || '',
      badgeAr: advertisement.badgeAr || advertisement.badge || '',
      badgeColor: advertisement.badgeColor || '#DAA520',
      description: advertisement.description || '',
      descriptionAr: advertisement.descriptionAr || advertisement.description || '',
      buttonText: advertisement.buttonText || '',
      buttonTextAr: advertisement.buttonTextAr || advertisement.buttonText || '',
      image: advertisement.image || '',
      price: advertisement.price || null,
      originalPrice: advertisement.originalPrice || null,
      displayType: advertisement.displayType || 'SINGLE',
      sortOrder: advertisement.sortOrder || 0,
      isActive: advertisement.isActive !== false,
      images: advertisement.images || [],
      highlightedWord: advertisement.highlightedWord || '',
      highlightedWordAr: advertisement.highlightedWordAr || '',
      highlightedWordColor: advertisement.highlightedWordColor || '',
      highlightedWordUnderline: advertisement.highlightedWordUnderline || false,
      showDiscountBadge: advertisement.showDiscountBadge !== false,
      discountBadgePosition: advertisement.discountBadgePosition || 'top-right',
      features: advertisement.features || [],
      testimonialText: advertisement.testimonialText || '',
      testimonialTextAr: advertisement.testimonialTextAr || '',
      testimonialAuthor: advertisement.testimonialAuthor || '',
      testimonialAuthorAr: advertisement.testimonialAuthorAr || '',
      createdAt: advertisement.createdAt ? advertisement.createdAt.toISOString() : null,
      updatedAt: advertisement.updatedAt ? advertisement.updatedAt.toISOString() : null
    };

    res.json({
      success: true,
      data: {
        advertisement: normalized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch advertisement'
    });
  }
};

// @desc    Create advertisement (Admin)
// @route   POST /api/admin/advertisements
// @access  Private/Admin
export const createAdvertisement = async (req, res) => {
  try {
    // Clean and normalize data
    const data = { ...req.body };
    
    // Remove CSRF token if present
    delete data.csrfToken;
    
    // Convert price and originalPrice to numbers if they're strings
    if (data.price !== undefined && data.price !== null && data.price !== '') {
      data.price = typeof data.price === 'string' ? parseFloat(data.price) : Number(data.price);
      if (isNaN(data.price)) {
        data.price = undefined;
      }
    } else {
      data.price = undefined;
    }
    
    if (data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '') {
      data.originalPrice = typeof data.originalPrice === 'string' ? parseFloat(data.originalPrice) : Number(data.originalPrice);
      if (isNaN(data.originalPrice)) {
        data.originalPrice = undefined;
      }
    } else {
      data.originalPrice = undefined;
    }
    
    // Handle empty image - use placeholder or make it optional
    if (!data.image || data.image.trim() === '') {
      // Use a default placeholder image if none provided
      data.image = '/uploads/good.png';
    }
    
    // Ensure required fields have defaults
    if (!data.title || data.title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    if (!data.titleAr || data.titleAr.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title (Arabic) is required'
      });
    }
    
    if (!data.description || data.description.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }
    
    if (!data.descriptionAr || data.descriptionAr.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Description (Arabic) is required'
      });
    }
    
    // Normalize displayType
    if (data.displayType && !['SINGLE', 'MULTIPLE', 'GRID', 'FEATURED', 'CAROUSEL'].includes(data.displayType)) {
      data.displayType = 'SINGLE';
    }
    
    // Normalize sortOrder
    if (data.sortOrder !== undefined) {
      data.sortOrder = typeof data.sortOrder === 'string' ? parseInt(data.sortOrder) : Number(data.sortOrder);
      if (isNaN(data.sortOrder)) {
        data.sortOrder = 0;
      }
    } else {
      data.sortOrder = 0;
    }
    
    // Normalize features array
    if (data.features && Array.isArray(data.features)) {
      data.features = data.features.map((feature, index) => ({
        title: feature.title || '',
        titleAr: feature.titleAr || '',
        icon: feature.icon || '',
        sortOrder: feature.sortOrder !== undefined ? Number(feature.sortOrder) : index
      })).filter(f => f.title || f.titleAr);
    } else {
      data.features = [];
    }
    
    // Normalize testimonial fields
    if (data.testimonialText === undefined || data.testimonialText === null) {
      data.testimonialText = '';
    }
    if (data.testimonialTextAr === undefined || data.testimonialTextAr === null) {
      data.testimonialTextAr = '';
    }
    if (data.testimonialAuthor === undefined || data.testimonialAuthor === null) {
      data.testimonialAuthor = '';
    }
    if (data.testimonialAuthorAr === undefined || data.testimonialAuthorAr === null) {
      data.testimonialAuthorAr = '';
    }
    
    // Normalize promotionalBadges array
    if (data.promotionalBadges && Array.isArray(data.promotionalBadges)) {
      data.promotionalBadges = data.promotionalBadges.map((badge, index) => ({
        text: badge.text || '',
        textAr: badge.textAr || '',
        icon: badge.icon || '',
        backgroundColor: badge.backgroundColor || '',
        textColor: badge.textColor || '',
        sortOrder: badge.sortOrder !== undefined ? Number(badge.sortOrder) : index
      })).filter(b => b.text || b.textAr);
    } else {
      data.promotionalBadges = [];
    }
    
    // Normalize buttons array
    if (data.buttons && Array.isArray(data.buttons)) {
      data.buttons = data.buttons.map((button, index) => ({
        text: button.text || '',
        textAr: button.textAr || '',
        href: button.href || '/products',
        variant: ['primary', 'secondary', 'outline'].includes(button.variant) ? button.variant : 'primary',
        sortOrder: button.sortOrder !== undefined ? Number(button.sortOrder) : index
      })).filter(b => b.text || b.textAr);
    } else {
      data.buttons = [];
    }
    
    // Normalize images array
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map(img => {
        if (typeof img === 'object' && img !== null) {
          return {
            url: img.url || '',
            alt: img.alt || '',
            altAr: img.altAr || '',
            name: img.name || '',
            nameAr: img.nameAr || '',
            price: img.price !== undefined && img.price !== null && img.price !== '' 
              ? (typeof img.price === 'string' ? parseFloat(img.price) : Number(img.price))
              : undefined,
            sortOrder: img.sortOrder !== undefined 
              ? (typeof img.sortOrder === 'string' ? parseInt(img.sortOrder) : Number(img.sortOrder))
              : 0
          };
        }
        return null;
      }).filter(img => img !== null && img.url && img.url.trim() !== '');
    } else {
      data.images = [];
    }
    
    const advertisement = await Advertisement.create(data);

    // Normalize response
    const normalized = {
      id: advertisement._id.toString(),
      title: advertisement.title || '',
      titleAr: advertisement.titleAr || advertisement.title || '',
      subtitle: advertisement.subtitle || '',
      subtitleAr: advertisement.subtitleAr || advertisement.subtitle || '',
      badge: advertisement.badge || '',
      badgeAr: advertisement.badgeAr || advertisement.badge || '',
      badgeColor: advertisement.badgeColor || '#DAA520',
      description: advertisement.description || '',
      descriptionAr: advertisement.descriptionAr || advertisement.description || '',
      buttonText: advertisement.buttonText || '',
      buttonTextAr: advertisement.buttonTextAr || advertisement.buttonText || '',
      image: advertisement.image || '',
      price: advertisement.price || null,
      originalPrice: advertisement.originalPrice || null,
      displayType: advertisement.displayType || 'SINGLE',
      sortOrder: advertisement.sortOrder || 0,
      isActive: advertisement.isActive !== false,
      images: advertisement.images || [],
      highlightedWord: advertisement.highlightedWord || '',
      highlightedWordAr: advertisement.highlightedWordAr || '',
      highlightedWordColor: advertisement.highlightedWordColor || '',
      highlightedWordUnderline: advertisement.highlightedWordUnderline || false,
      showDiscountBadge: advertisement.showDiscountBadge !== false,
      discountBadgePosition: advertisement.discountBadgePosition || 'top-right',
      features: advertisement.features || [],
      testimonialText: advertisement.testimonialText || '',
      testimonialTextAr: advertisement.testimonialTextAr || '',
      testimonialAuthor: advertisement.testimonialAuthor || '',
      testimonialAuthorAr: advertisement.testimonialAuthorAr || '',
      createdAt: advertisement.createdAt ? advertisement.createdAt.toISOString() : null,
      updatedAt: advertisement.updatedAt ? advertisement.updatedAt.toISOString() : null
    };

    res.status(201).json({
      success: true,
      data: {
        advertisement: normalized
      }
    });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create advertisement'
    });
  }
};

// @desc    Update advertisement (Admin)
// @route   PUT /api/admin/advertisements/:id or PUT /api/admin/advertisements (with id in body)
// @access  Private/Admin
export const updateAdvertisement = async (req, res) => {
  try {
    // Support both :id in params and id in body
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Advertisement ID is required'
      });
    }

    const updateData = { ...req.body };
    delete updateData.id; // Remove id from update data
    delete updateData.csrfToken; // Remove CSRF token if present
    
    // Convert price and originalPrice to numbers if they're strings
    // Handle null, empty string, and undefined cases
    if (updateData.price !== undefined && updateData.price !== null && updateData.price !== '') {
      const priceNum = typeof updateData.price === 'string' ? parseFloat(updateData.price) : Number(updateData.price);
      if (!isNaN(priceNum)) {
        updateData.price = priceNum;
      } else {
        updateData.price = null; // Set to null instead of deleting
      }
    } else if (updateData.price === '' || updateData.price === null) {
      updateData.price = null; // Allow clearing price by setting to null
    }
    
    if (updateData.originalPrice !== undefined && updateData.originalPrice !== null && updateData.originalPrice !== '') {
      const originalPriceNum = typeof updateData.originalPrice === 'string' ? parseFloat(updateData.originalPrice) : Number(updateData.originalPrice);
      if (!isNaN(originalPriceNum)) {
        updateData.originalPrice = originalPriceNum;
      } else {
        updateData.originalPrice = null; // Set to null instead of deleting
      }
    } else if (updateData.originalPrice === '' || updateData.originalPrice === null) {
      updateData.originalPrice = null; // Allow clearing price by setting to null
    }
    
    // Handle empty image - use placeholder or keep existing
    if (updateData.image !== undefined) {
      if (!updateData.image || updateData.image.trim() === '') {
        // If image is being cleared, use placeholder
        updateData.image = '/uploads/good.png';
      }
    }
    
    // Normalize displayType
    if (updateData.displayType && !['SINGLE', 'MULTIPLE', 'GRID', 'FEATURED', 'CAROUSEL'].includes(updateData.displayType)) {
      updateData.displayType = 'SINGLE';
    }
    
    // Normalize sortOrder
    if (updateData.sortOrder !== undefined) {
      updateData.sortOrder = typeof updateData.sortOrder === 'string' ? parseInt(updateData.sortOrder) : Number(updateData.sortOrder);
      if (isNaN(updateData.sortOrder)) {
        updateData.sortOrder = 0;
      }
    }
    
    // Normalize features array
    if (updateData.features !== undefined && Array.isArray(updateData.features)) {
      updateData.features = updateData.features.map((feature, index) => ({
        title: feature.title || '',
        titleAr: feature.titleAr || '',
        icon: feature.icon || '',
        sortOrder: feature.sortOrder !== undefined ? Number(feature.sortOrder) : index
      })).filter(f => f.title || f.titleAr);
    }
    
    // Normalize testimonial fields
    if (updateData.testimonialText !== undefined) {
      updateData.testimonialText = updateData.testimonialText || '';
    }
    if (updateData.testimonialTextAr !== undefined) {
      updateData.testimonialTextAr = updateData.testimonialTextAr || '';
    }
    if (updateData.testimonialAuthor !== undefined) {
      updateData.testimonialAuthor = updateData.testimonialAuthor || '';
    }
    if (updateData.testimonialAuthorAr !== undefined) {
      updateData.testimonialAuthorAr = updateData.testimonialAuthorAr || '';
    }
    
    // Normalize promotionalBadges array
    if (updateData.promotionalBadges !== undefined && Array.isArray(updateData.promotionalBadges)) {
      updateData.promotionalBadges = updateData.promotionalBadges.map((badge, index) => ({
        text: badge.text || '',
        textAr: badge.textAr || '',
        icon: badge.icon || '',
        backgroundColor: badge.backgroundColor || '',
        textColor: badge.textColor || '',
        sortOrder: badge.sortOrder !== undefined ? Number(badge.sortOrder) : index
      })).filter(b => b.text || b.textAr);
    }
    
    // Normalize buttons array
    if (updateData.buttons !== undefined && Array.isArray(updateData.buttons)) {
      updateData.buttons = updateData.buttons.map((button, index) => ({
        text: button.text || '',
        textAr: button.textAr || '',
        href: button.href || '/products',
        variant: ['primary', 'secondary', 'outline'].includes(button.variant) ? button.variant : 'primary',
        sortOrder: button.sortOrder !== undefined ? Number(button.sortOrder) : index
      })).filter(b => b.text || b.textAr);
    }
    
    // Normalize images array
    if (updateData.images !== undefined && Array.isArray(updateData.images)) {
      updateData.images = updateData.images.map(img => {
        if (typeof img === 'object' && img !== null) {
          return {
            url: img.url || '',
            alt: img.alt || '',
            altAr: img.altAr || '',
            name: img.name || '',
            nameAr: img.nameAr || '',
            price: img.price !== undefined && img.price !== null && img.price !== '' 
              ? (typeof img.price === 'string' ? parseFloat(img.price) : Number(img.price))
              : undefined,
            sortOrder: img.sortOrder !== undefined 
              ? (typeof img.sortOrder === 'string' ? parseInt(img.sortOrder) : Number(img.sortOrder))
              : 0
          };
        }
        return null;
      }).filter(img => img !== null && img.url && img.url.trim() !== '');
    }

    console.log('[Update Advertisement] Update data:', JSON.stringify(updateData, null, 2));
    console.log('[Update Advertisement] Price:', updateData.price, 'Type:', typeof updateData.price);
    console.log('[Update Advertisement] Original Price:', updateData.originalPrice, 'Type:', typeof updateData.originalPrice);
    
    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('[Update Advertisement] Updated advertisement price:', advertisement?.price);
    console.log('[Update Advertisement] Updated advertisement originalPrice:', advertisement?.originalPrice);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        error: 'Advertisement not found'
      });
    }

    // Normalize response
    const normalized = {
      id: advertisement._id.toString(),
      title: advertisement.title || '',
      titleAr: advertisement.titleAr || advertisement.title || '',
      subtitle: advertisement.subtitle || '',
      subtitleAr: advertisement.subtitleAr || advertisement.subtitle || '',
      badge: advertisement.badge || '',
      badgeAr: advertisement.badgeAr || advertisement.badge || '',
      badgeColor: advertisement.badgeColor || '#DAA520',
      description: advertisement.description || '',
      descriptionAr: advertisement.descriptionAr || advertisement.description || '',
      buttonText: advertisement.buttonText || '',
      buttonTextAr: advertisement.buttonTextAr || advertisement.buttonText || '',
      image: advertisement.image || '',
      price: advertisement.price || null,
      originalPrice: advertisement.originalPrice || null,
      displayType: advertisement.displayType || 'SINGLE',
      sortOrder: advertisement.sortOrder || 0,
      isActive: advertisement.isActive !== false,
      images: advertisement.images || [],
      highlightedWord: advertisement.highlightedWord || '',
      highlightedWordAr: advertisement.highlightedWordAr || '',
      highlightedWordColor: advertisement.highlightedWordColor || '',
      highlightedWordUnderline: advertisement.highlightedWordUnderline || false,
      showDiscountBadge: advertisement.showDiscountBadge !== false,
      discountBadgePosition: advertisement.discountBadgePosition || 'top-right',
      features: advertisement.features || [],
      testimonialText: advertisement.testimonialText || '',
      testimonialTextAr: advertisement.testimonialTextAr || '',
      testimonialAuthor: advertisement.testimonialAuthor || '',
      testimonialAuthorAr: advertisement.testimonialAuthorAr || '',
      createdAt: advertisement.createdAt ? advertisement.createdAt.toISOString() : null,
      updatedAt: advertisement.updatedAt ? advertisement.updatedAt.toISOString() : null
    };

    res.json({
      success: true,
      data: {
        advertisement: normalized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update advertisement'
    });
  }
};

// @desc    Delete advertisement (Admin)
// @route   DELETE /api/admin/advertisements/:id or DELETE /api/admin/advertisements?id=...
// @access  Private/Admin
export const deleteAdvertisement = async (req, res) => {
  try {
    // Support both :id in params and id in query
    const id = req.params.id || req.query.id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Advertisement ID is required'
      });
    }

    const advertisement = await Advertisement.findByIdAndDelete(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        error: 'Advertisement not found'
      });
    }

    res.json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete advertisement'
    });
  }
};

// @desc    Seed default advertisements
// @route   POST /api/admin/advertisements/seed
// @access  Private/Admin
export const seedAdvertisements = async (req, res) => {
  try {
    const defaultAdvertisements = [
      {
        title: 'Discover Our Latest Collection',
        titleAr: 'اكتشف مجموعتنا الأحدث',
        badge: 'New Arrivals',
        badgeAr: 'وصلات جديدة',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget tortor risus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.',
        descriptionAr: 'اكتشف أحدث مجموعاتنا من المنتجات المميزة. جودة عالية وتصميم عصري يناسب جميع الأذواق.',
        buttonText: 'Shop New Arrivals',
        buttonTextAr: 'تسوق الوصلات الجديدة',
        image: '/uploads/good.png',
        displayType: 'GRID',
        sortOrder: 0,
        isActive: true,
        images: [
          { url: '/uploads/good.png', alt: 'Modern Style', altAr: 'أسلوب عصري', name: 'Modern Style', nameAr: 'أسلوب عصري', price: 79.99, sortOrder: 0 },
          { url: '/uploads/good.png', alt: 'Casual Collection', altAr: 'مجموعة كاجوال', name: 'Casual Collection', nameAr: 'مجموعة كاجوال', price: 64.99, sortOrder: 1 },
          { url: '/uploads/good.png', alt: 'Premium Design', altAr: 'تصميم مميز', name: 'Premium Design', nameAr: 'تصميم مميز', price: 89.99, sortOrder: 2 },
          { url: '/uploads/good.png', alt: 'Elegant Series', altAr: 'سلسلة أنيقة', name: 'Elegant Series', nameAr: 'سلسلة أنيقة', price: 74.99, sortOrder: 3 }
        ]
      },
      {
        title: 'Season Sale Up To 50% Off',
        titleAr: 'عروض الموسم حتى 50% خصم',
        badge: 'Limited Time',
        badgeAr: 'وقت محدود',
        description: 'Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar.',
        descriptionAr: 'استفد من عروض الموسم المميزة. خصومات كبيرة على منتجاتنا الأكثر مبيعاً.',
        buttonText: 'Shop Sale',
        buttonTextAr: 'تسوق العروض',
        image: '/uploads/good.png',
        price: 64.99,
        originalPrice: 129.99,
        displayType: 'FEATURED',
        sortOrder: 1,
        isActive: true,
        showDiscountBadge: true,
        discountBadgePosition: 'top-right',
        images: []
      },
      {
        title: 'Premium Quality Products',
        titleAr: 'منتجات عالية الجودة',
        badge: 'Featured Collection',
        badgeAr: 'مجموعة مميزة',
        description: 'Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Donec rutrum congue leo eget malesuada. Cras ultricies ligula sed magna dictum porta.',
        descriptionAr: 'منتجاتنا تتميز بجودة عالية وتصميم فريد. مواد ممتازة وصناعة يدوية مع ضمان مدى الحياة.',
        buttonText: 'Explore Collection',
        buttonTextAr: 'استكشف المجموعة',
        image: '/uploads/good.png',
        displayType: 'SINGLE',
        sortOrder: 2,
        isActive: true,
        features: [
          { title: 'Premium Materials', titleAr: 'مواد ممتازة', icon: '✨', sortOrder: 0 },
          { title: 'Handcrafted Quality', titleAr: 'جودة يدوية', icon: '🎨', sortOrder: 1 },
          { title: 'Lifetime Warranty', titleAr: 'ضمان مدى الحياة', icon: '🛡️', sortOrder: 2 }
        ],
        testimonialText: 'Exceptional quality and design',
        testimonialTextAr: 'جودة وتصميم استثنائي',
        testimonialAuthor: 'Satisfied Customer',
        testimonialAuthorAr: 'عميل راضٍ',
        images: [
          { url: '/uploads/good.png', alt: 'Nullam quis ante', altAr: 'Nullam quis ante', name: 'Nullam quis ante', nameAr: 'Nullam quis ante', price: 79.99, sortOrder: 0 },
          { url: '/uploads/good.png', alt: 'Sed fringilla mauris', altAr: 'Sed fringilla mauris', name: 'Sed fringilla mauris', nameAr: 'Sed fringilla mauris', price: 89.99, sortOrder: 1 },
          { url: '/uploads/good.png', alt: 'Fusce vulputate eleifend', altAr: 'Fusce vulputate eleifend', name: 'Fusce vulputate eleifend', nameAr: 'Fusce vulputate eleifend', price: 99.99, sortOrder: 2 },
          { url: '/uploads/good.png', alt: 'Vestibulum dapibus nunc', altAr: 'Vestibulum dapibus nunc', name: 'Vestibulum dapibus nunc', nameAr: 'Vestibulum dapibus nunc', price: 109.99, sortOrder: 3 }
        ]
      },
      {
        title: 'Elevate Your Everyday Style',
        titleAr: 'ارفع مستوى أسلوبك اليومي',
        badge: 'FALL COLLECTION 2025',
        badgeAr: 'مجموعة خريف 2025',
        description: 'Discover our curated collection of premium essentials designed for comfort and versatility. Timeless pieces that transition seamlessly from day to night.',
        descriptionAr: 'اكتشف مجموعتنا المختارة بعناية من الأساسيات المميزة المصممة للراحة والتنوع. قطع خالدة تنتقل بسلاسة من النهار إلى الليل.',
        buttonText: 'Shop Collection',
        buttonTextAr: 'تسوق المجموعة',
        image: '/uploads/good.png',
        displayType: 'SINGLE',
        sortOrder: 3,
        isActive: true,
        highlightedWord: 'Everyday',
        highlightedWordAr: 'اليومي',
        highlightedWordColor: '#9333EA',
        highlightedWordUnderline: true,
        promotionalBadges: [
          { text: '25% OFF', textAr: 'خصم 25%', icon: '🛒', backgroundColor: '#FCE7F3', textColor: '#9F1239', sortOrder: 0 },
          { text: 'Free Shipping on Orders $75+', textAr: 'شحن مجاني للطلبات أكثر من 75$', icon: '❤️', backgroundColor: '#FCE7F3', textColor: '#9F1239', sortOrder: 1 }
        ],
        buttons: [
          { text: 'Shop Collection', textAr: 'تسوق المجموعة', href: '/products', variant: 'primary', sortOrder: 0 },
          { text: 'Discover More', textAr: 'اكتشف المزيد', href: '/products', variant: 'outline', sortOrder: 1 }
        ],
        images: [] // Empty array - single image only, no product grid
      }
    ];

    // Check if we should force update
    const force = req.query.force === 'true';
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const adData of defaultAdvertisements) {
      const existing = await Advertisement.findOne({ title: adData.title });
      if (!existing) {
        await Advertisement.create(adData);
        createdCount++;
        console.log(`✅ Created advertisement: ${adData.title}`);
      } else if (force) {
        await Advertisement.findOneAndUpdate({ title: adData.title }, adData, { new: true });
        updatedCount++;
        console.log(`🔄 Updated advertisement: ${adData.title}`);
      } else {
        console.log(`⏭️  Skipped existing advertisement: ${adData.title}`);
      }
    }
    
    const totalCount = await Advertisement.countDocuments();

    res.json({
      success: true,
      message: `Successfully processed advertisements. Created: ${createdCount}, Updated: ${updatedCount}, Total: ${totalCount}`,
      count: createdCount + updatedCount,
      created: createdCount,
      updated: updatedCount,
      total: totalCount
    });
  } catch (error) {
    console.error('Error seeding advertisements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to seed advertisements'
    });
  }
};

// @desc    Export current advertisements as defaults
// @route   GET /api/admin/advertisements/export-defaults
// @access  Private/Admin
export const exportAdvertisementsAsDefaults = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const exported = advertisements.map(ad => ({
      id: ad._id.toString(),
      title: ad.title || '',
      titleAr: ad.titleAr || ad.title || '',
      subtitle: ad.subtitle || '',
      subtitleAr: ad.subtitleAr || ad.subtitle || '',
      badge: ad.badge || '',
      badgeAr: ad.badgeAr || ad.badge || '',
      badgeColor: ad.badgeColor || '#DAA520',
      description: ad.description || '',
      descriptionAr: ad.descriptionAr || ad.description || '',
      buttonText: ad.buttonText || '',
      buttonTextAr: ad.buttonTextAr || ad.buttonText || '',
      image: ad.image || '/uploads/good.png',
      price: ad.price || null,
      originalPrice: ad.originalPrice || null,
      displayType: ad.displayType || 'SINGLE',
      sortOrder: ad.sortOrder || 0,
      isActive: ad.isActive !== false,
      images: ad.images || [],
      highlightedWord: ad.highlightedWord || '',
      highlightedWordAr: ad.highlightedWordAr || '',
      highlightedWordColor: ad.highlightedWordColor || '',
      highlightedWordUnderline: ad.highlightedWordUnderline || false,
      showDiscountBadge: ad.showDiscountBadge !== false,
      discountBadgePosition: ad.discountBadgePosition || 'top-right',
      features: ad.features || [],
      testimonialText: ad.testimonialText || '',
      testimonialTextAr: ad.testimonialTextAr || '',
      testimonialAuthor: ad.testimonialAuthor || '',
      testimonialAuthorAr: ad.testimonialAuthorAr || '',
      promotionalBadges: ad.promotionalBadges || [],
      buttons: ad.buttons || []
    }));

    res.json({
      success: true,
      data: exported,
      count: exported.length
    });
  } catch (error) {
    console.error('Error exporting advertisements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export advertisements'
    });
  }
};

