const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with empty profile image
    const user = await User.create({
      name,
      email,
      password,
      profileImage: '', // Explicitly set empty profile image
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: '', // Don't return any profile image for new users
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Extract email and password
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Return user data with token
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || '',
      token: generateToken(user._id),
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('Backend: Getting user profile for ID:', req.user.id);
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Backend: User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Backend: User found, has profileImage:', !!user.profileImage);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || ''
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update user profile image
// @route   POST /api/auth/profile-image
// @access  Private
exports.updateProfileImage = async (req, res) => {
  try {
    console.log('Backend: Processing profile image update for user:', req.user._id);
    
    if (!req.file) {
      console.log('Backend: No file uploaded');
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    console.log('Backend: File received:', req.file.filename);
    
    // Get server URL (based on request)
    const protocol = req.protocol || 'http';
    const host = process.env.DEVELOPER_IP || req.get('host') || 'localhost';
    const port = process.env.PORT || 5002;
    
    // Create a clean URL to the uploaded file
    const fileName = req.file.filename; // This should already be sanitized by multer
    const fileUrl = `${protocol}://${host}:${port}/uploads/${fileName}`;
    
    console.log('Backend: Created file URL:', fileUrl);
    
    // Update user's profile image URL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: fileUrl },
      { new: true }
    );

    if (!user) {
      console.log('Backend: User not found after update attempt');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Backend: User profile updated successfully');

    res.status(200).json({
      success: true,
      profileImage: fileUrl
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
}; 