const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Mark Attendance
router.post('/mark', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const result = await Attendance.markAttendance(req.body);
    
    // Activity Log
    const { pool } = require('../config/database');
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'ATTENDANCE', `Marked attendance for labour ID: ${req.body.labour_id}`, req.ip]
    );
    
    res.json({ success: true, data: result, message: 'Attendance marked!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Today's Attendance
router.get('/today', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const site_id = req.query.site_id;
    
    let query = `
      SELECT a.*, l.name, l.labour_code, lc.category_name, lc.category_code,
             s.site_name
      FROM attendance a
      JOIN labour l ON a.labour_id = l.id
      JOIN labour_categories lc ON l.category_id = lc.id
      JOIN sites s ON a.site_id = s.id
      WHERE a.date = CURDATE()
    `;
    const params = [];
    
    if (site_id) {
      query += ' AND a.site_id = ?';
      params.push(site_id);
    }
    
    query += ' ORDER BY l.name';
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Today's Summary
router.get('/today-summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const [result] = await pool.query(`
      SELECT 
        COUNT(*) as total_present,
        SUM(total_hajri) as total_hajri,
        SUM(company_bill) as total_company_bill,
        SUM(our_payment) as total_our_payment,
        SUM(profit) as total_profit,
        SUM(overtime_hours) as total_ot_hours
      FROM attendance
      WHERE date = CURDATE()
    `);
    
    res.json({ success: true, data: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;