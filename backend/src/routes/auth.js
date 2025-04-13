const express = require('express');
const { register, login, getMe, updateProfileImage } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/profile-image', protect, upload.single('profileImage'), updateProfileImage);

// Bookmark routes
router.post('/bookmarks', protect, require('../controllers/bookmarks').addBookmark);
router.delete('/bookmarks/:bookmarkId', protect, require('../controllers/bookmarks').removeBookmark);
router.get('/bookmarks', protect, require('../controllers/bookmarks').getBookmarks);

module.exports = router; 