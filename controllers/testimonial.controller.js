// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
export const getTestimonials = async (req, res) => {
  try {
    // Return empty array for now - can be extended later with database model
    res.json({
      success: true,
      images: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch testimonials'
    });
  }
};

