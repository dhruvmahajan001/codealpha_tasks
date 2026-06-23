const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getTrendingHashtags,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  getPostComments,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Post feed & creation
router.route('/')
  .post(protect, createPost)
  .get(getPosts);

// Trending hashtags (registered before dynamic ID route)
router.get('/trending', getTrendingHashtags);

// Single post operations
router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Likes
router.post('/:id/like', protect, likePost);
router.post('/:id/unlike', protect, unlikePost);

// Comments
router.post('/:id/comment', protect, addComment);
router.get('/:id/comments', getPostComments);

module.exports = router;
