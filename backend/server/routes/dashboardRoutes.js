const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get Dashboard Stats (Finalized Only)
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Total Labour
    const [labourCount] = await pool.query(
      'SELECT COUNT(*) as total FROM labour WHERE is_active = TRUE'
    );
    
    // Today's Finalized Attendance
    const [todayAttendance] = await pool.query(
      `SELECT COUNT(*) as present, SUM(total_hajri) as total_hajri,
              SUM(profit) as total_profit
       FROM attendance
       WHERE date = CURDATE() AND is_finalized = TRUE AND status != 'absent'`
    );
    
    // Total Outstanding Advances
    const [advances] = await pool.query(
      `SELECT SUM(total_advance_taken - total_advance_recovered) as outstanding 
       FROM labour WHERE is_active = TRUE`
    );
    
    res.json({
      success: true,
      data: {
        total_labour: labourCount[0].total,
        present_today: todayAttendance[0].present || 0,
        today_profit: todayAttendance[0].total_profit || 0,
        total_outstanding: advances[0].outstanding || 0,
        today_hajri: todayAttendance[0].total_hajri || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Site-wise Attendance Summary (Today)
router.get('/site-wise', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const [rows] = await pool.query(`
      SELECT s.id, s.site_name,
        SUM(CASE WHEN a.status = 'present' AND a.is_finalized = TRUE THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'half_day' AND a.is_finalized = TRUE THEN 1 ELSE 0 END) as half_day,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.is_finalized = FALSE THEN 1 ELSE 0 END) as pending_finalize,
        COUNT(DISTINCT a.labour_id) as total_marked
      FROM sites s
      LEFT JOIN attendance a ON s.id = a.site_id AND a.date = CURDATE()
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.site_name
      ORDER BY s.site_name
    `);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pending Finalization (Today + Previous Days)
router.get('/pending-finalization', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const [rows] = await pool.query(`
      SELECT a.date, s.site_name, COUNT(*) as pending_count
      FROM attendance a
      JOIN sites s ON a.site_id = s.id
      WHERE a.is_finalized = FALSE
      GROUP BY a.date, s.site_name
      ORDER BY a.date DESC, s.site_name
    `);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;