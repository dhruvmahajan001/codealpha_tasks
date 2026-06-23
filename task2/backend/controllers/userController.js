const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get user profile details
// @route   GET /api/users/profile/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Find user and populate followers/following arrays
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'name username profilePicture')
      .populate('following', 'name username profilePicture');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get posts count
    const postCount = await Post.countDocuments({ author: userId });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        followers: user.followers,
        following: user.following,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postCount: postCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update fields if provided
    user.name = req.body.name || user.name;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.profilePicture = req.body.profilePicture !== undefined ? req.body.profilePicture : user.profilePicture;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/follow/:id
// @access  Private
const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // Prevent following self
    if (targetUserId === currentUserId.toString()) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      res.status(404);
      throw new Error('User to follow not found');
    }

    // Check if already following
    if (currentUser.following.includes(targetUserId)) {
      res.status(400);
      throw new Error('You are already following this user');
    }

    // Add to following/followers lists
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `Successfully followed ${targetUser.username}`,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   POST /api/users/unfollow/:id
// @access  Private
const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      res.status(404);
      throw new Error('User to unfollow not found');
    }

    // Check if not following
    if (!currentUser.following.includes(targetUserId)) {
      res.status(400);
      throw new Error('You are not following this user');
    }

    // Remove from following/followers lists
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `Successfully unfollowed ${targetUser.username}`,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user suggestions for current user (users not followed yet)
// @route   GET /api/users/suggestions
// @access  Private
const getUserSuggestions = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    // Find users excluding current user and users already followed
    const suggestions = await User.find({
      _id: { $ne: currentUserId, $nin: currentUser.following }
    })
      .select('name username profilePicture')
      .limit(5);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getUserSuggestions,
};
