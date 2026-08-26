const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Create Supervisor
router.post('/create', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { name, mobile, aadhar_no, address, assigned_site_id, joining_date,
            in_hand_salary, khoraki_allowance, mobile_allowance, travel_allowance,
            accommodation_allowance } = req.body;

    const [result] = await pool.query(
      `INSERT INTO supervisors (name, mobile, aadhar_no, address, assigned_site_id,
        joining_date, in_hand_salary, khoraki_allowance, mobile_allowance,
        travel_allowance, accommodation_allowance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile, aadhar_no, address, assigned_site_id, joining_date,
       in_hand_salary || 15000, khoraki_allowance || 3000, mobile_allowance || 500,
       travel_allowance || 1500, accommodation_allowance || 2000]
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Supervisor created!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get All Supervisors
router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.query(
      `SELECT s.*, st.site_name FROM supervisors s
       LEFT JOIN sites st ON s.assigned_site_id = st.id
       ORDER BY s.is_active DESC, s.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Give Advance to Supervisor
router.post('/advance', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { supervisor_id, amount, remarks } = req.body;

    await pool.query(
      `INSERT INTO supervisor_advances (supervisor_id, amount, remarks, payment_date)
       VALUES (?, ?, ?, CURDATE())`,
      [supervisor_id, amount, remarks]
    );

    await pool.query(
      `UPDATE supervisors SET total_advance_taken = total_advance_taken + ? WHERE id = ?`,
      [amount, supervisor_id]
    );

    res.json({ success: true, message: 'Advance given to supervisor!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;