const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Add Expense
router.post('/add', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { category_name, amount, expense_date, expense_type, paid_to, payment_mode, remarks } = req.body;

    await pool.query(
      `INSERT INTO expenses (category_name, amount, expense_date, expense_type, paid_to, payment_mode, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_name, amount, expense_date, expense_type || 'BUSINESS', paid_to, payment_mode || 'CASH', remarks, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Expense added!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Expenses
router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { type, month } = req.query;
    
    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params = [];
    
    if (type) { query += ' AND expense_type = ?'; params.push(type); }
    if (month) { query += ' AND DATE_FORMAT(expense_date, "%Y-%m") = ?'; params.push(month); }
    
    query += ' ORDER BY expense_date DESC';
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Expense Summary
router.get('/summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { month } = req.query;
    
    const [result] = await pool.query(
      `SELECT expense_type, SUM(amount) as total 
       FROM expenses 
       WHERE DATE_FORMAT(expense_date, "%Y-%m") = ?
       GROUP BY expense_type`,
      [month || new Date().toISOString().slice(0,7)]
    );
    
    const summary = { BUSINESS: 0, PERSONAL: 0 };
    result.forEach(r => { summary[r.expense_type] = r.total; });
    
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;