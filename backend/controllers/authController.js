const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'campus_task_manager_secret_key_2026_se_project',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email address'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration. Please try again.'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Validate user and check password
    if (user && (await user.matchPassword(password))) {
      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login. Please try again.'
    });
  }
};

// @desc    Logout user / clear session
// @route   POST /api/auth/logout
// @access  Public (client simply discards token, server returns success)
const logoutUser = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully. Please remove your access token.'
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is already populated by protect middleware
    res.status(200).json({
      status: 'success',
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch Me Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching user details'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe
};
