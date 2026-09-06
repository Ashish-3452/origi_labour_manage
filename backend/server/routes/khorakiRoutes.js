const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// Direct Khoraki Payment (No Calculation)
router.post('/pay', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { labour_id, week_start, week_end, amount, advance_deducted } = req.body;
    const receipt_no = 'KHO-' + Date.now().toString(36).toUpperCase();
    const net_payable = (amount || 0) - (advance_deducted || 0);

    // Insert khoraki payment record
    await pool.query(
      `INSERT INTO khoraki (labour_id, week_start, week_end, total_khoraki, advance_deducted, net_payable, paid_date, receipt_no, status) 
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, 'PAID')`,
      [labour_id, week_start, week_end, amount, advance_deducted, net_payable, receipt_no]
    );

    // Advance recovery update (if any)
    if (advance_deducted > 0) {
      await pool.query(
        `UPDATE labour SET total_advance_recovered = total_advance_recovered + ? WHERE id = ?`,
        [advance_deducted, labour_id]
      );
    }

    // Activity Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'KHORAKI', `Paid khoraki ₹${net_payable} to labour ID: ${labour_id}`, req.ip]
    );

    res.json({ success: true, receipt_no, message: 'Khoraki paid successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;