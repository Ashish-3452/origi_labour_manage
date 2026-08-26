const express = require('express');
const router = express.Router();
const { login, register, getProfile } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getProfile);
router.post('/register', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), register);

// Get All Users (Admin only)
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [users] = await pool.query(
      'SELECT id, name, mobile, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle User Status
router.put('/users/:id/toggle', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ? AND role != "SUPER_ADMIN"', [req.params.id]);
    res.json({ success: true, message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;