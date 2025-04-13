const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Add a bookmark to user's bookmarks
// @route   POST /api/auth/bookmarks
// @access  Private
const addBookmark = asyncHandler(async (req, res) => {
  console.log('Server: Adding bookmark, received data:', req.body);
  const { name, description, image, url, brand, category, productId } = req.body;

  if (!name || !category || !productId) {
    console.log('Server: Missing required fields:', { name, category, productId });
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if bookmark already exists
  const user = await User.findById(req.user.id);
  
  const existingBookmark = user.bookmarks.find(
    bookmark => bookmark.productId === productId && bookmark.category === category
  );

  if (existingBookmark) {
    console.log('Server: Product already bookmarked:', productId, category);
    res.status(400);
    throw new Error('Product is already bookmarked');
  }

  // Log image data
  console.log('Server: Image URL being saved:', image);
  
  // Add bookmark
  const newBookmark = {
    name,
    description,
    image: image || '', // Ensure we have a value even if null/undefined
    url,
    brand,
    category,
    productId
  };
  
  user.bookmarks.push(newBookmark);
  console.log('Server: Added new bookmark:', newBookmark);

  await user.save();
  console.log('Server: Successfully saved user with new bookmark');

  res.status(201).json({
    success: true,
    data: user.bookmarks
  });
});

// @desc    Remove a bookmark from user's bookmarks
// @route   DELETE /api/auth/bookmarks/:bookmarkId
// @access  Private
const removeBookmark = asyncHandler(async (req, res) => {
  const bookmarkId = req.params.bookmarkId;
  console.log('Server: Removing bookmark with ID:', bookmarkId);
  
  if (!bookmarkId) {
    res.status(400);
    throw new Error('Please provide a bookmark ID');
  }

  // Get user
  const user = await User.findById(req.user.id);
  
  // Format: "category-productId"
  const [category, productId] = bookmarkId.split('-');
  console.log('Server: Parsed bookmark ID into:', { category, productId });
  
  // Filter out the bookmark to remove
  const initialLength = user.bookmarks.length;
  
  user.bookmarks = user.bookmarks.filter(
    bookmark => !(bookmark.category === category && bookmark.productId === productId)
  );

  // Check if bookmark was found and removed
  if (user.bookmarks.length === initialLength) {
    console.log('Server: Bookmark not found:', { category, productId });
    res.status(404);
    throw new Error('Bookmark not found');
  }

  console.log('Server: Removed bookmark, new count:', user.bookmarks.length);
  await user.save();

  res.status(200).json({
    success: true,
    data: user.bookmarks
  });
});

// @desc    Get user's bookmarks
// @route   GET /api/auth/bookmarks
// @access  Private
const getBookmarks = asyncHandler(async (req, res) => {
  console.log('Server: Getting bookmarks for user:', req.user.id);
  const user = await User.findById(req.user.id);
  
  console.log('Server: Found bookmarks count:', user.bookmarks.length);
  
  // Log a sample bookmark if available
  if (user.bookmarks.length > 0) {
    console.log('Server: Sample bookmark:', user.bookmarks[0]);
  }
  
  res.status(200).json({
    success: true,
    data: user.bookmarks
  });
});

module.exports = {
  addBookmark,
  removeBookmark,
  getBookmarks
}; 