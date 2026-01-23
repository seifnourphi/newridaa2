import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Secure file deletion utility
 * Deletes a file from the uploads directory safely
 */
export const deleteUploadedFile = (filename) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, filename);

        // Security check: ensure file is within uploads directory
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadDir = path.resolve(uploadDir);

        if (!resolvedPath.startsWith(resolvedUploadDir)) {
            throw new Error('Invalid file path - security violation');
        }

        // Check if file exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * Get file size in a human-readable format
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate image dimensions (optional - for future use)
 */
export const validateImageDimensions = async (filePath, maxWidth = 4096, maxHeight = 4096) => {
    // This would require sharp or jimp library
    // For now, just return true
    return true;
};

/**
 * Clean old uploaded files (optional - for maintenance)
 * Removes files older than specified days
 */
export const cleanOldUploads = (daysOld = 30) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        const files = fs.readdirSync(uploadDir);
        const now = Date.now();
        const maxAge = daysOld * 24 * 60 * 60 * 1000;

        let deletedCount = 0;

        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });

        return deletedCount;
    } catch (error) {
        console.error('Error cleaning old uploads:', error);
        return 0;
    }
};
