const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { content, image } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('Post content cannot be empty');
    }

    const post = await Post.create({
      author: req.user._id,
      content,
      image: image || '',
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'name username profilePicture'
    );

    res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (with optional search filter)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      // Find users whose name or username matches search query
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      // Search posts containing text OR posts created by matched users
      query = {
        $or: [
          { content: { $regex: search, $options: 'i' } },
          { author: { $in: userIds } },
        ],
      };
    }

    const posts = await Post.find(query)
      .populate('author', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending hashtags
// @route   GET /api/posts/trending
// @access  Public
const getTrendingHashtags = async (req, res, next) => {
  try {
    const posts = await Post.find({}).select('content');
    const hashtagMap = {};

    posts.forEach((post) => {
      // Regex to find hashtags
      const hashtags = post.content.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach((tag) => {
          const cleanTag = tag.toLowerCase();
          hashtagMap[cleanTag] = (hashtagMap[cleanTag] || 0) + 1;
        });
      }
    });

    // Convert map to array and sort by frequency
    const sortedHashtags = Object.keys(hashtagMap)
      .map((tag) => ({ tag, count: hashtagMap[tag] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 trending hashtags

    res.status(200).json({
      success: true,
      data: sortedHashtags,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username profilePicture',
        },
      });

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Author only)
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Verify authorship
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this post');
    }

    post.content = req.body.content || post.content;
    post.image = req.body.image !== undefined ? req.body.image : post.image;

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id).populate(
      'author',
      'name username profilePicture'
    );

    res.status(200).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Author only)
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Verify authorship
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this post');
    }

    // Delete all linked comments
    await Comment.deleteMany({ post: post._id });

    // Delete post
    await Post.deleteOne({ _id: post._id });

    res.status(200).json({
      success: true,
      message: 'Post and associated comments successfully deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check if user already liked
    if (post.likes.includes(req.user._id)) {
      res.status(400);
      throw new Error('Post already liked');
    }

    post.likes.push(req.user._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post liked',
      likes: post.likes,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a post
// @route   POST /api/posts/:id/unlike
// @access  Private
const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check if user has liked
    if (!post.likes.includes(req.user._id)) {
      res.status(400);
      throw new Error('Post has not been liked yet');
    }

    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unliked',
      likes: post.likes,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;

    if (!content) {
      res.status(400);
      throw new Error('Comment content cannot be empty');
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content,
    });

    // Add comment to post's comment references list
    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name username profilePicture'
    );

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
const getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
