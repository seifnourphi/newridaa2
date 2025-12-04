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

    // Return the Base64 encoded file
    const fileData = {
      data: req.file.buffer.toString('base64'),
      contentType: req.file.mimetype
    };

    res.json({
      success: true,
      file: fileData,
      data: fileData.data,
      contentType: fileData.contentType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

