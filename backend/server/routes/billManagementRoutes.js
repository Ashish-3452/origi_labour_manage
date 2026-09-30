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

// Site-wise Bill Summary
router.get('/summary/site-wise', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { month } = req.query;
    
    let whereClause = '';
    const params = [];
    if (month) {
      whereClause = ' AND DATE_FORMAT(b.bill_date, "%Y-%m") = ?';
      params.push(month);
    }

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.site_name,
        COUNT(b.id) as total_bills,
        COALESCE(SUM(b.bill_amount), 0) as total_bill_amount,
        COALESCE(SUM(b.food_advance_deducted), 0) as total_food_deducted,
        COALESCE(SUM(b.other_deductions), 0) as total_other_deductions,
        COALESCE(SUM(b.net_payable), 0) as total_net_payable,
        COALESCE(SUM(b.amount_received), 0) as total_received,
        COALESCE(SUM(b.balance), 0) as total_balance,
        SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN b.status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN b.status = 'PAID' THEN 1 ELSE 0 END) as paid_count
      FROM sites s
      LEFT JOIN bills b ON s.id = b.site_id ${whereClause}
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.site_name
      ORDER BY total_balance DESC
    `, params);

    // Grand totals
    const totals = rows.reduce((acc, r) => ({
      total_bills: acc.total_bills + Number(r.total_bills),
      total_bill_amount: acc.total_bill_amount + Number(r.total_bill_amount),
      total_food_deducted: acc.total_food_deducted + Number(r.total_food_deducted),
      total_net_payable: acc.total_net_payable + Number(r.total_net_payable),
      total_received: acc.total_received + Number(r.total_received),
      total_balance: acc.total_balance + Number(r.total_balance),
    }), {
      total_bills: 0, total_bill_amount: 0, total_food_deducted: 0,
      total_net_payable: 0, total_received: 0, total_balance: 0
    });

    res.json({ success: true, data: rows, totals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pending Bills Aging Report
router.get('/summary/aging', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.id, b.bill_no, b.bill_date, b.period_start, b.period_end,
        b.net_payable, b.amount_received, b.balance, b.status,
        s.site_name,
        DATEDIFF(CURDATE(), b.bill_date) as days_pending,
        CASE 
          WHEN DATEDIFF(CURDATE(), b.bill_date) <= 15 THEN '0-15 days'
          WHEN DATEDIFF(CURDATE(), b.bill_date) <= 30 THEN '15-30 days'
          WHEN DATEDIFF(CURDATE(), b.bill_date) <= 60 THEN '30-60 days'
          ELSE '60+ days'
        END as aging_bucket
      FROM bills b
      JOIN sites s ON b.site_id = s.id
      WHERE b.status IN ('PENDING', 'PARTIAL') AND b.balance > 0
      ORDER BY days_pending DESC
    `);

    // Aging summary
    const buckets = {
      '0-15 days': { count: 0, amount: 0 },
      '15-30 days': { count: 0, amount: 0 },
      '30-60 days': { count: 0, amount: 0 },
      '60+ days': { count: 0, amount: 0 }
    };
    
    rows.forEach(r => {
      const b = r.aging_bucket;
      if (buckets[b]) {
        buckets[b].count += 1;
        buckets[b].amount += Number(r.balance);
      }
    });

    res.json({ success: true, data: rows, buckets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;