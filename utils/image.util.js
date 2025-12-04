// Image utility functions for Base64 conversion and handling

/**
 * Convert Buffer to Base64 string
 * @param {Buffer} buffer - File buffer from multer
 * @returns {string} Base64 encoded string
 */
export const bufferToBase64 = (buffer) => {
    return buffer.toString('base64');
};

/**
 * Create data URL from Base64 and content type
 * @param {string} base64 - Base64 encoded string
 * @param {string} contentType - MIME type (e.g., 'image/jpeg')
 * @returns {string} Data URL
 */
export const createDataUrl = (base64, contentType) => {
    if (!base64 || !contentType) return null;
    return `data:${contentType};base64,${base64}`;
};

/**
 * Convert file object to Base64 image object
 * @param {Object} file - Multer file object
 * @returns {Object} Image object with data and contentType
 */
export const fileToBase64Image = (file) => {
    if (!file || !file.buffer) return null;
    return {
        data: bufferToBase64(file.buffer),
        contentType: file.mimetype
    };
};

/**
 * Convert multiple files to Base64 image objects
 * @param {Array} files - Array of multer file objects
 * @returns {Array} Array of image objects with data and contentType
 */
export const filesToBase64Images = (files) => {
    if (!files || !Array.isArray(files) || files.length === 0) return [];
    return files.map(file => fileToBase64Image(file)).filter(img => img !== null);
};

/**
 * Get image source for frontend display
 * @param {Object} image - Image object with data and contentType
 * @returns {string|null} Data URL or null
 */
export const getImageSrc = (image) => {
    if (!image || !image.data || !image.contentType) return null;
    return createDataUrl(image.data, image.contentType);
};

/**
 * Validate image size (Base64 increases size by ~33%)
 * @param {string} base64 - Base64 encoded string
 * @param {number} maxSizeKB - Maximum size in KB (default 5MB)
 * @returns {boolean} True if size is valid
 */
export const validateImageSize = (base64, maxSizeKB = 5120) => {
    if (!base64) return false;
    const sizeInBytes = (base64.length * 3) / 4; // Approximate original size
    const sizeInKB = sizeInBytes / 1024;
    return sizeInKB <= maxSizeKB;
};
