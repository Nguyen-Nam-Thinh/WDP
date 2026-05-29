const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { AppError } = require('../middleware/error.middleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload single file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name (e.g., 'users/avatars', 'horses/images')
 * @param {string} publicId - Optional custom public ID
 * @returns {Promise<{url, publicId}>}
 */
async function uploadSingle(fileBuffer, folder, publicId = null) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: !!publicId,
      },
      (error, result) => {
        if (error) reject(new AppError(400, `Upload failed: ${error.message}`));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    const bufferStream = Readable.from(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Upload multiple files to Cloudinary
 * @param {Buffer[]} fileBuffers - Array of file buffers
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array<{url, publicId}>>}
 */
async function uploadMultiple(fileBuffers, folder) {
  const promises = fileBuffers.map((buffer, index) => uploadSingle(buffer, folder, null));
  return Promise.all(promises);
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
async function deleteFile(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete ${publicId}:`, error);
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
function extractPublicId(url) {
  if (!url) return null;
  // Extract everything after /upload/(v{digits}/)? up to the last extension
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : null;
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  extractPublicId,
};
