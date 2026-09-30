const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// Generate unique bill number
const generateBillNo = () => {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${yy}${mm}-${rand}`;
};

// Calculate Food Advance Total for date range (used before creating bill)
router.get('/calculate-deduction', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { site_id, period_start, period_end } = req.query;

    if (!site_id || !period_start || !period_end) {
      return res.status(400).json({ success: false, error: 'site_id, period_start, period_end required' });
    }

    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_food_advance
       FROM food_advances
       WHERE site_id = ? AND given_date >= ? AND given_date <= ?`,
      [site_id, period_start, period_end]
    );

    res.json({ 
      success: true, 
      food_advance_deducted: Number(rows[0].total_food_advance) 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Bill
router.post('/create', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { 
      site_id, bill_date, period_start, period_end, 
      bill_amount, food_advance_deducted, other_deductions, remarks 
    } = req.body;

    if (!site_id || !period_start || !period_end || !bill_amount) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const foodDed = Number(food_advance_deducted) || 0;
    const otherDed = Number(other_deductions) || 0;
    const billAmt = Number(bill_amount);
    const netPayable = billAmt - foodDed - otherDed;
    const bill_no = generateBillNo();

    const [result] = await pool.query(
      `INSERT INTO bills (site_id, bill_no, bill_date, period_start, period_end, 
        bill_amount, food_advance_deducted, other_deductions, net_payable, 
        amount_received, balance, status, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'PENDING', ?, ?)`,
      [site_id, bill_no, bill_date || new Date(), period_start, period_end,
       billAmt, foodDed, otherDed, netPayable, netPayable, remarks, req.user.id]
    );

    // Activity Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'BILL_CREATE', `Bill ${bill_no} created - ₹${netPayable}`, req.ip]
    );

    res.status(201).json({ 
      success: true, 
      id: result.insertId, 
      bill_no,
      net_payable: netPayable,
      message: 'Bill created!' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get All Bills (with filters)
router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { site_id, status, month } = req.query;
    
    let query = `
      SELECT b.*, s.site_name
      FROM bills b
      JOIN sites s ON b.site_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (site_id) { query += ' AND b.site_id = ?'; params.push(site_id); }
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (month) { 
      query += ' AND DATE_FORMAT(b.bill_date, "%Y-%m") = ?'; 
      params.push(month); 
    }

    query += ' ORDER BY b.bill_date DESC, b.id DESC LIMIT 200';

    const [rows] = await pool.query(query, params);

    // Stats
    const [stats] = await pool.query(
      `SELECT 
        COALESCE(SUM(bill_amount), 0) as total_bill_amount,
        COALESCE(SUM(food_advance_deducted), 0) as total_food_deducted,
        COALESCE(SUM(net_payable), 0) as total_net_payable,
        COALESCE(SUM(amount_received), 0) as total_received,
        COALESCE(SUM(balance), 0) as total_balance,
        COUNT(*) as total_bills,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_bills,
        SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_bills,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_bills
       FROM bills WHERE 1=1
       ${site_id ? 'AND site_id = ?' : ''}
       ${status ? 'AND status = ?' : ''}
       ${month ? 'AND DATE_FORMAT(bill_date, "%Y-%m") = ?' : ''}`,
      [
        ...(site_id ? [site_id] : []),
        ...(status ? [status] : []),
        ...(month ? [month] : [])
      ]
    );

    res.json({ success: true, data: rows, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Bill Details with Payment History
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const [bills] = await pool.query(
      `SELECT b.*, s.site_name FROM bills b
       JOIN sites s ON b.site_id = s.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (!bills.length) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    const [payments] = await pool.query(
      `SELECT bp.*, u.name as created_by_name
       FROM bill_payments bp
       LEFT JOIN users u ON bp.created_by = u.id
       WHERE bp.bill_id = ?
       ORDER BY bp.payment_date DESC, bp.id DESC`,
      [req.params.id]
    );

    res.json({ 
      success: true, 
      data: bills[0],
      payments 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Payment to Bill
router.post('/:id/payment', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { amount, payment_date, payment_mode, reference_no, remarks } = req.body;

    if (!amount || !payment_date) {
      return res.status(400).json({ success: false, error: 'Amount aur date required' });
    }

    // Get bill
    const [bills] = await pool.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);
    if (!bills.length) return res.status(404).json({ success: false, error: 'Bill not found' });

    const bill = bills[0];
    const newAmountReceived = Number(bill.amount_received) + Number(amount);
    const newBalance = Number(bill.net_payable) - newAmountReceived;

    let newStatus = 'PARTIAL';
    if (newBalance <= 0) newStatus = 'PAID';
    if (newAmountReceived === 0) newStatus = 'PENDING';

    // Insert payment
    await pool.query(
      `INSERT INTO bill_payments (bill_id, amount, payment_date, payment_mode, reference_no, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, amount, payment_date, payment_mode || 'BANK_TRANSFER', reference_no, remarks, req.user.id]
    );

    // Update bill
    await pool.query(
      `UPDATE bills SET amount_received = ?, balance = ?, status = ? WHERE id = ?`,
      [newAmountReceived, newBalance, newStatus, req.params.id]
    );

    // Activity Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'BILL_PAYMENT', `Payment ₹${amount} received for bill ${bill.bill_no}`, req.ip]
    );

    res.json({ 
      success: true, 
      message: 'Payment recorded!',
      balance: newBalance,
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Bill
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM bills WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Bill deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;