const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Give Advance
router.post('/advance', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const result = await Payment.giveAdvance({
      ...req.body,
      created_by: req.user.id
    });
    const { pool } = require('../config/database');
await pool.query(
  'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
  [req.user.id, 'PAYMENT', `Gave advance of ₹${req.body.amount} to labour ID: ${req.body.labour_id}`, req.ip]
);
    res.json({ success: true, data: result, message: 'Advance payment recorded!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Payment History
router.get('/history/:labourId', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.query(
      `SELECT * FROM payments WHERE labour_id = ? ORDER BY created_at DESC`,
      [req.params.labourId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;