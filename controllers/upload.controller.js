// @desc    Upload file
// @route   POST /api/upload
// @access  Private/Admin
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Return the file URL
    // Check if file is in a subdirectory (e.g., avatars, logos)
    const filePath = req.file.path;
    const uploadsDir = filePath.includes('avatars') ? '/uploads/avatars' :
                      filePath.includes('logos') ? '/uploads/logos' :
                      filePath.includes('payment-proofs') ? '/uploads/payment-proofs' :
                      '/uploads';
    
    const fileUrl = `${uploadsDir}/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

