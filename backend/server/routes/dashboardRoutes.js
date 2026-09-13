const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get Dashboard Stats (Top Cards - Finalized Only for profit/hajri)
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Total Labour (Active)
    const [labourCount] = await pool.query(
      'SELECT COUNT(*) as total FROM labour WHERE is_active = TRUE'
    );
    
    // Present Today (Morning Preset + Finalized, status != absent)
    const [presentCount] = await pool.query(
      `SELECT COUNT(*) as present FROM attendance 
       WHERE date = CURDATE() AND status != 'absent'`
    );
    
    // Absent Today
    const [absentCount] = await pool.query(
      `SELECT COUNT(*) as absent FROM attendance 
       WHERE date = CURDATE() AND status = 'absent'`
    );
    
    // Finalized Hajri & Profit (Sirf finalized)
    const [finalizedStats] = await pool.query(
      `SELECT SUM(total_hajri) as total_hajri, SUM(profit) as total_profit
       FROM attendance
       WHERE date = CURDATE() AND is_finalized = TRUE`
    );
    
    // Outstanding Advances
    const [advances] = await pool.query(
      `SELECT SUM(total_advance_taken - total_advance_recovered) as outstanding 
       FROM labour WHERE is_active = TRUE`
    );
    
    res.json({
      success: true,
      data: {
        total_labour: labourCount[0].total,
        present_today: presentCount[0].present || 0,
        absent_today: absentCount[0].absent || 0,
        today_profit: finalizedStats[0].total_profit || 0,
        total_outstanding: advances[0].outstanding || 0,
        today_hajri: finalizedStats[0].total_hajri || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Site-wise Attendance Summary (Today - Temporary + Finalized)
router.get('/site-wise', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const [rows] = await pool.query(`
      SELECT s.id, s.site_name,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'half_day' THEN 1 ELSE 0 END) as half_day,
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

// Pending Finalization (All dates)
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

// Full Dashboard Summary (All in One)
router.get('/full-summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // 1. Top 10 labour with highest dues (active + inactive)
    const [topDues] = await pool.query(`
      SELECT l.id, l.name, l.labour_code, lc.category_name,
             (l.total_advance_taken - l.total_advance_recovered) as balance_due
      FROM labour l
      JOIN labour_categories lc ON l.category_id = lc.id
      WHERE (l.total_advance_taken - l.total_advance_recovered) > 0
      ORDER BY balance_due DESC
      LIMIT 10
    `);
    
    // 2. Supervisor financial summary
    const [supervisorSummary] = await pool.query(`
      SELECT 
        COUNT(*) as total_supervisors,
        SUM(in_hand_salary + khoraki_allowance + mobile_allowance + travel_allowance + accommodation_allowance) as total_monthly_cost,
        SUM(total_advance_taken) as total_advance_taken,
        SUM(total_advance_recovered) as total_advance_recovered,
        SUM(total_advance_taken - total_advance_recovered) as outstanding_advance
      FROM supervisors
      WHERE is_active = TRUE
    `);
    
    // 3. Profit summary (current month)
    const currentMonth = new Date().toISOString().slice(0,7);
    const [profitSummary] = await pool.query(`
      SELECT 
        (SELECT SUM(company_bill) FROM attendance WHERE DATE_FORMAT(date, '%Y-%m') = ? AND is_finalized = TRUE) as company_bill,
        (SELECT SUM(our_payment) FROM attendance WHERE DATE_FORMAT(date, '%Y-%m') = ? AND is_finalized = TRUE) as labour_payment,
        (SELECT SUM(amount) FROM expenses WHERE expense_type = 'BUSINESS' AND DATE_FORMAT(expense_date, '%Y-%m') = ?) as business_expense
    `, [currentMonth, currentMonth, currentMonth]);
    
    // 4. Total outstanding (labour + supervisor)
    const [labourOutstanding] = await pool.query(
      'SELECT SUM(total_advance_taken - total_advance_recovered) as outstanding FROM labour WHERE is_active = TRUE'
    );
    
    const totalOutstanding = 
      Number(labourOutstanding[0]?.outstanding || 0) + 
      Number(supervisorSummary[0]?.outstanding_advance || 0);
    
    res.json({
      success: true,
      data: {
        topDuesLabour: topDues,
        supervisorSummary: supervisorSummary[0] || {},
        profitSummary: profitSummary[0] || {},
        totalOutstanding: totalOutstanding
      }
    });
    
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Notifications / Alerts
router.get('/notifications', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const notifications = [];

    // 1. Pending finalization alerts
    const [pending] = await pool.query(`
      SELECT a.date, s.site_name, COUNT(*) as count
      FROM attendance a
      JOIN sites s ON a.site_id = s.id
      WHERE a.is_finalized = FALSE
      GROUP BY a.date, s.site_name
      ORDER BY a.date DESC
      LIMIT 5
    `);

    pending.forEach(p => {
      notifications.push({
        type: 'warning',
        title: 'Pending Finalization',
        message: `${p.site_name} - ${new Date(p.date).toLocaleDateString('hi-IN')} (${p.count} labour)`,
        date: p.date,
        icon: 'clock'
      });
    });

    // 2. High dues labour alerts (balance > 10000)
    const [highDues] = await pool.query(`
      SELECT l.name, l.labour_code,
             (l.total_advance_taken - l.total_advance_recovered) as balance
      FROM labour l
      WHERE (l.total_advance_taken - l.total_advance_recovered) > 10000
      ORDER BY balance DESC
      LIMIT 5
    `);

    highDues.forEach(h => {
      notifications.push({
        type: 'error',
        title: 'High Dues Alert',
        message: `${h.name} (${h.labour_code}) - ₹${Number(h.balance).toLocaleString()} pending`,
        icon: 'warning'
      });
    });

    // 3. Today's absent count
    const [absent] = await pool.query(`
      SELECT COUNT(*) as count FROM attendance 
      WHERE date = CURDATE() AND status = 'absent'
    `);

    if (absent[0].count > 0) {
      notifications.push({
        type: 'info',
        title: 'Absent Today',
        message: `${absent[0].count} labour absent today`,
        icon: 'info'
      });
    }

    res.json({ 
      success: true, 
      count: notifications.length,
      data: notifications 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;