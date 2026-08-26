const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Please login first.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account deactivated.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please login again.'
    });
  }
};

// Role-based Authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Input Validation Middleware
const validateLabour = (req, res, next) => {
  const { name, category_id, site_id } = req.body;
  const errors = [];
  
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!category_id) errors.push('Category is required');
  if (!site_id) errors.push('Site is required');
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

const validatePayment = (req, res, next) => {
  const { labour_id, amount } = req.body;
  const errors = [];
  
  if (!labour_id) errors.push('Labour is required');
  if (!amount || amount <= 0) errors.push('Amount must be greater than 0');
  if (amount > 50000) errors.push('Amount exceeds maximum limit of ₹50,000');
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

// Activity Logger
const logActivity = async (userId, action, description, req) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const ip = req.ip || req.connection.remoteAddress;
    await ActivityLog.log(userId, action, description, ip);
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = { authenticate, authorize, validateLabour, validatePayment };
