const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // 1. Check all required fields
    if (!name || !username || !email || !password || !confirmPassword) {
      res.status(400);
      throw new Error('All fields are required');
    }

    // 2. Validate password match
    if (password !== confirmPassword) {
      res.status(400);
      throw new Error('Passwords do not match');
    }

    // 3. Password length check
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // 4. Check if username exists
    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username is already taken');
    }

    // 5. Check if email exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      res.status(400);
      throw new Error('Email is already registered');
    }

    // 6. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Create User
    const user = await User.create({
      name,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check inputs
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // 2. Find User by email or username (for better UX)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: email.toLowerCase().trim() }
      ]
    });

    // 3. Verify user and match password
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
};
