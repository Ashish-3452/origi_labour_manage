const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validate input
    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide mobile number and password'
      });
    }

    // Check if user exists
    const user = await User.findByMobile(mobile);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid mobile number or password'
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid mobile number or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Contact admin.'
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user.id);

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        assigned_site_id: user.assigned_site_id,
        permissions: user.permissions,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  }
};

// @desc    Register new user (Admin/Supervisor)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, mobile, email, password, role, assigned_site_id, permissions } = req.body;

    // Validate
    if (!name || !mobile || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByMobile(mobile);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this mobile number already exists'
      });
    }

    // Only SUPER_ADMIN can create ADMIN users
    if (role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admin can create Admin users'
      });
    }

    // Create user
    const userId = await User.create({
      name,
      mobile,
      email: email || null,
      password,
      role,
      assigned_site_id: assigned_site_id || null,
      permissions: permissions || {},
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  }
};