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

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
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
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
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
    console.log('Backend: User found, has profileImageType:', !!user.profileImageType);

    // Create a data URL for the profile image if one exists
    let profileImageUrl = '';
    if (user.profileImage && user.profileImageType) {
      profileImageUrl = `data:${user.profileImageType};base64,${user.profileImage}`;
      console.log('Backend: Created data URL with type:', user.profileImageType);
    } else {
      console.log('Backend: No profile image data available');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: profileImageUrl
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

    console.log('Backend: File received, mimetype:', req.file.mimetype);
    console.log('Backend: File size:', req.file.size, 'bytes');

    // Convert the buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    console.log('Backend: Converted image to base64, length:', base64Image.length);
    
    // Get the image MIME type for later use when displaying
    const imageType = req.file.mimetype;
    
    // Update user's profile image in MongoDB
    console.log('Backend: Updating user profile with image data');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        profileImage: base64Image,
        profileImageType: imageType
      },
      { new: true }
    );

    if (!user) {
      console.log('Backend: User not found after update attempt');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Backend: User profile updated successfully');
    // For the response, create a data URL that can be used directly in <img> tags
    const dataUrl = `data:${imageType};base64,${base64Image}`;

    res.status(200).json({
      success: true,
      profileImage: dataUrl
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
}; 