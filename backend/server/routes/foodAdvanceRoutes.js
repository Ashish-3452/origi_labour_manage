const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// Create Food Advance
router.post('/create', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { site_id, week_start, week_end, amount, given_date, given_to, remarks } = req.body;

    if (!site_id || !week_start || !week_end || !amount || !given_date) {
      return res.status(400).json({ success: false, error: 'Saare required fields bharein' });
    }

    const [result] = await pool.query(
      `INSERT INTO food_advances (site_id, week_start, week_end, amount, given_date, given_to, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [site_id, week_start, week_end, amount, given_date, given_to, remarks, req.user.id]
    );

    // Activity Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'FOOD_ADVANCE', `Food advance ₹${amount} for site ID: ${site_id}`, req.ip]
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Food advance saved!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Food Advance List (with filters)
router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { site_id, from_date, to_date, month } = req.query;
    
    let query = `
      SELECT f.*, s.site_name
      FROM food_advances f
      JOIN sites s ON f.site_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (site_id) {
      query += ' AND f.site_id = ?';
      params.push(site_id);
    }
    if (from_date) {
      query += ' AND f.given_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND f.given_date <= ?';
      params.push(to_date);
    }
    if (month) {
      query += ' AND DATE_FORMAT(f.given_date, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' ORDER BY f.given_date DESC, f.id DESC LIMIT 200';

    const [rows] = await pool.query(query, params);

    // Stats
    const [stats] = await pool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as total_entries
       FROM food_advances
       WHERE 1=1
       ${site_id ? 'AND site_id = ?' : ''}
       ${from_date ? 'AND given_date >= ?' : ''}
       ${to_date ? 'AND given_date <= ?' : ''}`,
      [
        ...(site_id ? [site_id] : []),
        ...(from_date ? [from_date] : []),
        ...(to_date ? [to_date] : [])
      ]
    );

    res.json({ success: true, data: rows, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Food Advance Total for a date range (used in bill entry)
router.get('/total', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { site_id, from_date, to_date } = req.query;

    if (!site_id || !from_date || !to_date) {
      return res.status(400).json({ success: false, error: 'site_id, from_date, to_date required' });
    }

    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM food_advances
       WHERE site_id = ? AND given_date >= ? AND given_date <= ?`,
      [site_id, from_date, to_date]
    );

    res.json({ success: true, total: Number(rows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Food Advance
router.put('/update/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { site_id, week_start, week_end, amount, given_date, given_to, remarks } = req.body;

    await pool.query(
      `UPDATE food_advances 
       SET site_id = ?, week_start = ?, week_end = ?, amount = ?, given_date = ?, given_to = ?, remarks = ?
       WHERE id = ?`,
      [site_id, week_start, week_end, amount, given_date, given_to, remarks, req.params.id]
    );

    res.json({ success: true, message: 'Food advance updated!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Food Advance
router.delete('/delete/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM food_advances WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Food advance deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;