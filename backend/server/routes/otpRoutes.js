const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendOtpSms, generateOtp } = require('../utils/smsHelper');

// STEP 1: Request OTP
router.post('/request', async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit mobile required' });
    }

    // Check user exists
    const user = await User.findByMobile(mobile);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found. Contact admin.' });
    }

    // Generate OTP
    const otp = generateOtp();
    await Otp.saveOtp(mobile, otp);

    // Send SMS
    await sendOtpSms(mobile, otp);

    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // Remove this in production:
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });

  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// STEP 2: Verify OTP & Login
router.post('/verify', async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile and OTP required' });
    }

    // Verify OTP
    const isValid = await Otp.verifyOtp(mobile, otp);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Get user
    const user = await User.findByMobile(mobile);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Account inactive. Contact admin.' });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions
      }
    });

  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

module.exports = router;