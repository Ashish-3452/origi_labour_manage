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

// Morning Preset (Subah ka temporary mark)
router.post('/morning-preset', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { site_id, date } = req.body;
    const Attendance = require('../models/Attendance');
    const result = await Attendance.markMorningPreset(site_id, date, req.user.id);
    res.json({ success: true, count: result.count, message: 'Morning preset done!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Finalize Attendance (Shaam ka final update)
router.put('/finalize', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const result = await Attendance.finalizeAttendance(req.body);
    res.json({ success: true, message: 'Attendance finalized!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get attendance list for date & site
router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { date, site_id } = req.query;
    const Attendance = require('../models/Attendance');
    const attendance = await Attendance.getList(date, site_id);
    res.json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick Update Status (Present/Absent) without finalizing
router.put('/update-status', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { labour_id, date, status } = req.body;
    const { pool } = require('../config/database');
    await pool.query(
      'UPDATE attendance SET status = ? WHERE labour_id = ? AND date = ? AND is_finalized = FALSE',
      [status, labour_id, date]
    );
    res.json({ success: true, message: 'Status updated!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get full attendance report for a date & site
router.get('/report', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { date, site_id } = req.query;
    
    const { pool } = require('../config/database');
    
    const [report] = await pool.query(
      `SELECT l.id, l.labour_code, l.name, lc.category_name,
              a.status, a.regular_hours, a.overtime_hours, a.total_hajri,
              a.is_finalized, a.remarks
       FROM labour l
       JOIN labour_categories lc ON l.category_id = lc.id
       LEFT JOIN attendance a ON a.labour_id = l.id AND a.date = ?
       WHERE l.is_active = TRUE AND l.site_id = ?
       ORDER BY l.name ASC`,
      [date, site_id]
    );

    // Summary counts
    const summary = {
      total: report.length,
      present: report.filter(r => r.status === 'present').length,
      half_day: report.filter(r => r.status === 'half_day').length,
      absent: report.filter(r => r.status === 'absent').length,
      unmarked: report.filter(r => !r.status).length,
      finalized: report.filter(r => r.is_finalized).length,
      pending_finalize: report.filter(r => r.status && !r.is_finalized).length
    };

    res.json({ success: true, data: report, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;