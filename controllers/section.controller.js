import Settings from '../models/Settings.model.js';

const defaultSections = [
  {
    id: 'featured',
    name: 'Featured Picks',
    nameAr: 'مختارات مميزة',
    isEnabled: true,
    sortOrder: 1,
    maxProducts: 8,
    showTitle: true,
    showViewAll: true,
  },
  {
    id: 'latest',
    name: 'Latest Arrivals',
    nameAr: 'أحدث المنتجات',
    isEnabled: true,
    sortOrder: 2,
    maxProducts: 8,
    showTitle: true,
    showViewAll: true,
    selectedProductIds: [],
  },
  {
    id: 'bestsellers',
    name: 'Bestsellers',
    nameAr: 'الأكثر مبيعًا',
    isEnabled: true,
    sortOrder: 3,
    maxProducts: 8,
    showTitle: true,
    showViewAll: true,
  },
  {
    id: 'new',
    name: 'New & Trending',
    nameAr: 'جديد وعصري',
    isEnabled: true,
    sortOrder: 4,
    maxProducts: 8,
    showTitle: true,
    showViewAll: true,
  },
];

// @desc    Get homepage section settings
// @route   GET /api/sections
// @access  Public
export const getSections = async (req, res) => {
  try {
    // Try to get sections from database
    const settings = await Settings.findOne({ key: 'section_sections' });
    
    let sections = defaultSections;
    
    if (settings && settings.value) {
      try {
        // Parse stored sections
        const parsedSections = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
        
        if (Array.isArray(parsedSections) && parsedSections.length > 0) {
          sections = parsedSections;
        }
      } catch (parseError) {
        console.error('Error parsing sections from database:', parseError);
        // Fall back to default sections
      }
    }
    
    res.json({
      success: true,
      sections: sections,
      data: {
        sections: sections,
      },
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    // Return default sections on error
    res.json({
      success: true,
      sections: defaultSections,
      data: {
        sections: defaultSections,
      },
    });
  }
};

// @desc    Update homepage section settings
// @route   POST /api/admin/sections
// @access  Private (Admin)
export const updateSections = async (req, res) => {
  try {
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({
        success: false,
        error: 'Sections array is required'
      });
    }

    // Validate and normalize sections data
    const validatedSections = sections.map((section, index) => {
      // Normalize maxProducts to number
      let maxProducts = 8;
      if (typeof section.maxProducts === 'number' && !isNaN(section.maxProducts)) {
        maxProducts = section.maxProducts;
      } else if (typeof section.maxProducts === 'string') {
        const parsed = parseInt(section.maxProducts, 10);
        if (!isNaN(parsed)) {
          maxProducts = parsed;
        }
      } else if (section.maxProducts !== undefined && section.maxProducts !== null) {
        const converted = Number(section.maxProducts);
        if (!isNaN(converted)) {
          maxProducts = converted;
        }
      }
      maxProducts = Math.max(1, Math.min(100, Math.floor(maxProducts)));

      // Normalize selectedProductIds
      let selectedProductIds = undefined;
      if (section.selectedProductIds && Array.isArray(section.selectedProductIds)) {
        selectedProductIds = section.selectedProductIds
          .map((id) => {
            if (typeof id === 'string' && id.trim().length > 0) {
              return id.trim();
            }
            if (typeof id === 'number' && !isNaN(id)) {
              return String(id);
            }
            return null;
          })
          .filter((id) => id != null && typeof id === 'string' && id.length > 0);
      }

      return {
        id: section.id || `section-${index}`,
        name: section.name || 'Section',
        nameAr: section.nameAr || section.name || 'قسم',
        isEnabled: section.isEnabled !== undefined ? Boolean(section.isEnabled) : true,
        sortOrder: typeof section.sortOrder === 'number' ? section.sortOrder : (index + 1),
        maxProducts: maxProducts,
        showTitle: section.showTitle !== undefined ? Boolean(section.showTitle) : true,
        showViewAll: section.showViewAll !== undefined ? Boolean(section.showViewAll) : true,
        selectedProductIds: selectedProductIds
      };
    });

    // Save to database using Settings model
    const savedValue = JSON.stringify(validatedSections);
    
    await Settings.findOneAndUpdate(
      { key: 'section_sections' },
      { 
        key: 'section_sections', 
        value: savedValue,
        type: 'array'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Sections saved to database:', validatedSections.length, 'sections');

    res.json({
      success: true,
      message: 'Sections updated successfully',
      data: {
        sections: validatedSections
      }
    });
  } catch (error) {
    console.error('Error updating sections:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update sections'
    });
  }
};

