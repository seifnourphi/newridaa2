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

    // Extract relative path from absolute path
    const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
    const fileUrl = `/uploads${relativePath}`;

    // Return the file information
    const fileData = {
      filename: req.file.filename,
      path: fileUrl,
      url: fileUrl,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    res.json({
      success: true,
      file: fileData,
      url: fileData.url,
      filename: fileData.filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

