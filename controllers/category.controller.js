import Category from '../models/Category.model.js';

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name nameAr slug image parent');

    const normalized = categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      nameAr: category.nameAr || category.name,
      slug: category.slug,
      image: category.image || null,
      parentId: category.parent ? category.parent.toString() : null,
    }));

    res.json({
      success: true,
      categories: normalized,
      data: {
        categories: normalized,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch categories',
    });
  }
};

// @desc    Get all categories (Admin - includes inactive)
// @route   GET /api/admin/categories
// @access  Private/Admin
export const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .select('name nameAr slug image parent isActive description descriptionAr sortOrder')
      .lean();

    const normalized = categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      nameAr: category.nameAr || category.name,
      slug: category.slug,
      image: category.image || null,
      parentId: category.parent ? category.parent.toString() : null,
      isActive: category.isActive !== false,
      description: category.description || '',
      descriptionAr: category.descriptionAr || '',
      sortOrder: category.sortOrder || 0,
    }));

    res.json({
      success: true,
      data: {
        categories: normalized,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch categories',
    });
  }
};

// @desc    Create category (Admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, nameAr, slug, description, descriptionAr, image, parentId, isActive, sortOrder } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category slug is required'
      });
    }

    // Check if category with same slug already exists
    const existingCategory = await Category.findOne({ slug: slug.toLowerCase().trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this slug already exists'
      });
    }

    // Check if parent category exists (if provided)
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent category not found'
        });
      }
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      nameAr: nameAr?.trim() || name.trim(),
      slug: slug.toLowerCase().trim(),
      description: description?.trim() || '',
      descriptionAr: descriptionAr?.trim() || '',
      image: image || null,
      parent: parentId || null,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      data: {
        category: {
          id: category._id.toString(),
          name: category.name,
          nameAr: category.nameAr,
          slug: category.slug,
          description: category.description,
          descriptionAr: category.descriptionAr,
          image: category.image,
          parentId: category.parent ? category.parent.toString() : null,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
        }
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create category',
    });
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameAr, slug, description, descriptionAr, image, parentId, isActive, sortOrder } = req.body;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if slug is being changed and if new slug already exists
    if (slug && slug.toLowerCase().trim() !== category.slug) {
      const existingCategory = await Category.findOne({ slug: slug.toLowerCase().trim() });
      if (existingCategory && existingCategory._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          error: 'Category with this slug already exists'
        });
      }
    }

    // Check if parent category exists (if provided)
    if (parentId && parentId !== category.parent?.toString()) {
      if (parentId === id) {
        return res.status(400).json({
          success: false,
          error: 'Category cannot be its own parent'
        });
      }
      const parent = await Category.findById(parentId);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent category not found'
        });
      }
    }

    // Update category
    if (name !== undefined) category.name = name.trim();
    if (nameAr !== undefined) category.nameAr = nameAr?.trim() || category.name;
    if (slug !== undefined) category.slug = slug.toLowerCase().trim();
    if (description !== undefined) category.description = description?.trim() || '';
    if (descriptionAr !== undefined) category.descriptionAr = descriptionAr?.trim() || '';
    if (image !== undefined) category.image = image || null;
    if (parentId !== undefined) category.parent = parentId || null;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder || 0;

    await category.save();

    res.json({
      success: true,
      data: {
        category: {
          id: category._id.toString(),
          name: category.name,
          nameAr: category.nameAr,
          slug: category.slug,
          description: category.description,
          descriptionAr: category.descriptionAr,
          image: category.image,
          parentId: category.parent ? category.parent.toString() : null,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
        }
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update category',
    });
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if category has children
    const children = await Category.find({ parent: id });
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with subcategories. Please delete or move subcategories first.'
      });
    }

    // Delete category
    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete category',
    });
  }
};

