const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getUserSuggestions,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Suggestions route (must be before profile/:id)
router.get('/suggestions', protect, getUserSuggestions);

// Profile routes
router.get('/profile/:id', getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Follow/Unfollow routes
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);

module.exports = router;
