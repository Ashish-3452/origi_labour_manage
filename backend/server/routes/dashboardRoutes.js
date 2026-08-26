const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get Dashboard Stats
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Total Labour
    const [labourCount] = await pool.query(
      'SELECT COUNT(*) as total FROM labour WHERE is_active = TRUE'
    );
    
    // Today's Attendance
    const [todayAttendance] = await pool.query(
      `SELECT COUNT(*) as present, SUM(total_hajri) as total_hajri,
              SUM(profit) as total_profit
       FROM attendance WHERE date = CURDATE()`
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

module.exports = router;