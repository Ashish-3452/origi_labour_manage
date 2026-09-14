const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// Give Advance
router.post('/advance', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const result = await Payment.giveAdvance({
      ...req.body,
      created_by: req.user.id
    });
    
    // Activity Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'PAYMENT', `Gave advance of ₹${req.body.amount} to labour ID: ${req.body.labour_id}`, req.ip]
    );
    
    res.json({ success: true, data: result, message: 'Advance payment recorded!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Full Advance Payment History (All Labour) - MUST BE FIRST
router.get('/all-history', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, l.name, l.labour_code, lc.category_name
      FROM payments p
      JOIN labour l ON p.labour_id = l.id
      JOIN labour_categories lc ON l.category_id = lc.id
      WHERE p.payment_type = 'ADVANCE'
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT 200
    `);
    
    const [stats] = await pool.query(`
      SELECT 
        SUM(total_amount) as total_given,
        SUM(advance_deducted) as total_recovered,
        SUM(total_amount - advance_deducted) as total_outstanding
      FROM payments
      WHERE payment_type = 'ADVANCE'
    `);
    
    res.json({ 
      success: true, 
      data: rows,
      stats: stats[0] || { total_given: 0, total_recovered: 0, total_outstanding: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Advance History for specific labour - MUST BE AFTER /all-history
router.get('/history/:labourId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM payments 
       WHERE labour_id = ? AND payment_type = 'ADVANCE'
       ORDER BY payment_date DESC`,
      [req.params.labourId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;