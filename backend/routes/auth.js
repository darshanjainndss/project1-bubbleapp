const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const admin = require('../config/firebase');

const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateGoogleLogin = [
  body('firebaseId')
    .notEmpty()
    .withMessage('Firebase ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

// @route   POST /api/auth/register
// @desc    Register a new user with email/password
// @access  Public
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName,
      isGoogleLogin: false,
      isVerified: false
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with email/password
// @access  Public
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if it's a Google login user
    if (user.isGoogleLogin) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/google-login
// @desc    Login/Register user with Google
// @access  Public
router.post('/google-login', validateGoogleLogin, handleValidationErrors, async (req, res) => {
  try {
    const { firebaseId, email, displayName, profilePicture } = req.body;

    // Verify Firebase ID token (optional - for extra security)
    // You can uncomment this if you want to verify the Firebase token
    /*
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseId);
      if (decodedToken.email !== email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Firebase token'
        });
      }
    } catch (firebaseError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token'
      });
    }
    */

    // Check if user exists by Firebase ID
    let user = await User.findOne({ firebaseId, isActive: true });

    if (!user) {
      // Check if user exists by email (might be switching from email/password to Google)
      user = await User.findOne({ email, isActive: true });
      
      if (user && !user.isGoogleLogin) {
        // Update existing email/password user to Google login
        user.firebaseId = firebaseId;
        user.isGoogleLogin = true;
        user.displayName = displayName;
        if (profilePicture) user.profilePicture = profilePicture;
        await user.save();
      } else if (!user) {
        // Create new Google user
        user = new User({
          email,
          displayName,
          profilePicture,
          firebaseId,
          isGoogleLogin: true,
          isVerified: true // Google accounts are pre-verified
        });
        await user.save();
      }
    } else {
      // Update existing Google user info
      user.displayName = displayName;
      if (profilePicture) user.profilePicture = profilePicture;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You could implement token blacklisting here if needed
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   POST /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      user: user.getPublicProfile()
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;