const multer = require('multer');
const { AppError } = require('./error.middleware');

// Store files in memory
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(file.mimetype)) {
    cb(new AppError(400, 'Only image files are allowed (jpeg, png, webp, gif)'));
  } else {
    cb(null, true);
  }
};

// Single file upload (for avatar)
const uploadSingleMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('file');

// Multiple files upload (for horse images)
const uploadMultipleMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('files', 10); // Max 10 files

// Wrapper for single upload
function uploadSingle(req, res, next) {
  uploadSingleMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      }
      return res.status(err.statusCode || 400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    next();
  });
}

// Wrapper for multiple upload
function uploadMultiple(req, res, next) {
  uploadMultipleMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      }
      return res.status(err.statusCode || 400).json({ success: false, message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    next();
  });
}

module.exports = { uploadSingle, uploadMultiple };
