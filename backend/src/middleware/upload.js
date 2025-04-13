const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with sanitized name
    const userId = req.user ? req.user._id : 'unknown';
    const timestamp = Date.now();
    
    // Clean up extension and create a safe filename
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext || ext === '.') ext = '.jpg'; // Default to jpg if no extension
    if (ext.length > 5) ext = '.jpg'; // If too long, default to jpg
    
    // Sanitize extension - only allow common image formats
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExts.includes(ext)) ext = '.jpg';
    
    // Create a clean filename with no special characters
    const cleanFilename = `${userId}-${timestamp}${ext}`;
    
    cb(null, cleanFilename);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload; 