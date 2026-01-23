import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory
const uploadBaseDir = path.join(__dirname, '../uploads');

// Create subdirectories for different upload types
const createUploadDirs = () => {
  const dirs = [
    uploadBaseDir,
    path.join(uploadBaseDir, 'products'),
    path.join(uploadBaseDir, 'ads'),
    path.join(uploadBaseDir, 'users'),
    path.join(uploadBaseDir, 'temp')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize directories
createUploadDirs();

// Configure storage - use disk storage for file-based uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine subfolder based on route, query param, or field name
    let subfolder = 'temp'; // default

    // Debug logging
    console.log('📤 Upload Request Debug:');
    console.log('  - req.query:', req.query);
    console.log('  - req.baseUrl:', req.baseUrl);

    // Check query parameter first (available immediately)
    const uploadType = req.query && req.query.type ? req.query.type : null;
    console.log('  - uploadType:', uploadType);

    if (uploadType === 'product' || req.baseUrl.includes('/products')) {
      subfolder = 'products';
    } else if (uploadType === 'ad' || req.baseUrl.includes('/advertisements')) {
      subfolder = 'ads';
    } else if (req.baseUrl.includes('/users') || req.baseUrl.includes('/account')) {
      subfolder = 'users';
    }

    console.log('  - Selected subfolder:', subfolder);

    const uploadPath = path.join(uploadBaseDir, subfolder);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomhash-originalname
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // Sanitize filename - remove special characters
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

    // Format: image_timestamp_hash.ext (matches requested format)
    const uniqueFilename = `image_${timestamp}_${randomHash}${ext}`;

    cb(null, uniqueFilename);
  }
});

// File filter - security validation
const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and PDF files are allowed!'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

// Multiple file upload for product images
export const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: fileFilter
}).array('images', 10); // Max 10 images

