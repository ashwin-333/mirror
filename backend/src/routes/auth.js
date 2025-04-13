const express = require('express');
const { register, login, getMe, updateProfileImage } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/profile-image', protect, upload.single('profileImage'), updateProfileImage);

module.exports = router; 