const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Calculate & Process Khoraki
router.post('/process', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { labour_id, week_start, week_end } = req.body;

    // Get attendance for the week
    const [attendance] = await pool.query(
      `SELECT SUM(total_hajri) as total_hajri FROM attendance 
       WHERE labour_id = ? AND date BETWEEN ? AND ?`,
      [labour_id, week_start, week_end]
    );

    const totalHajri = attendance[0].total_hajri || 0;
    
    // Get labour khoraki rate
    const [labour] = await pool.query(
      `SELECT l.id, lc.khoraki_rate FROM labour l 
       JOIN labour_categories lc ON l.category_id = lc.id 
       WHERE l.id = ?`, [labour_id]
    );

    if (!labour.length) return res.status(404).json({ error: 'Labour not found' });

    const rate = labour[0].khoraki_rate;
    const totalKhoraki = Math.round(totalHajri * rate);

    res.json({
      success: true,
      data: { total_hajri: totalHajri, khoraki_rate: rate, total_khoraki: totalKhoraki }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Khoraki Payment
router.post('/pay', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { labour_id, week_start, week_end, total_khoraki, advance_deducted, net_payable } = req.body;
    const receipt_no = 'KHO-' + Date.now().toString(36).toUpperCase();

    await pool.query(
      `INSERT INTO khoraki (labour_id, week_start, week_end, total_khoraki, advance_deducted, net_payable, paid_date, receipt_no, status) 
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, 'PAID')`,
      [labour_id, week_start, week_end, total_khoraki, advance_deducted, net_payable, receipt_no]
    );

    // Update advance recovered
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;