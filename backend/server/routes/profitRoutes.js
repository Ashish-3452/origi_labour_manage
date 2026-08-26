const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get Profit Summary
router.get('/summary', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // Company Billing (Attendance se)
    const [billing] = await pool.query(
      `SELECT SUM(company_bill) as total FROM attendance 
       WHERE DATE_FORMAT(date, '%Y-%m') = ?`, [targetMonth]
    );

    // Labour Payments
    const [labourPay] = await pool.query(
      `SELECT SUM(our_payment) as total FROM attendance 
       WHERE DATE_FORMAT(date, '%Y-%m') = ?`, [targetMonth]
    );

    // Supervisor Costs
    const [supervisorCost] = await pool.query(
      `SELECT SUM(in_hand_salary + khoraki_allowance + mobile_allowance + travel_allowance + accommodation_allowance) as total 
       FROM supervisors WHERE is_active = TRUE`
    );

    // Business Expenses
    const [expenses] = await pool.query(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE expense_type = 'BUSINESS' AND DATE_FORMAT(expense_date, '%Y-%m') = ?`, [targetMonth]
    );

    // Personal Expenses
    const [personal] = await pool.query(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE expense_type = 'PERSONAL' AND DATE_FORMAT(expense_date, '%Y-%m') = ?`, [targetMonth]
    );

    const companyBill = Number(billing[0].total) || 0;
    const labourPayment = Number(labourPay[0].total) || 0;
    const supervisorCosts = Number(supervisorCost[0].total) || 0;
    const businessExpense = Number(expenses[0].total) || 0;
    const personalExpense = Number(personal[0].total) || 0;

    const grossProfit = companyBill - labourPayment;
    const netBusinessProfit = grossProfit - supervisorCosts - businessExpense;
    const netSaving = netBusinessProfit - personalExpense;

    res.json({
      success: true,
      data: {
        month: targetMonth,
        company_bill: companyBill,
        labour_payment: labourPayment,
        gross_profit: grossProfit,
        gross_profit_percent: companyBill > 0 ? ((grossProfit / companyBill) * 100).toFixed(1) : 0,
        supervisor_cost: supervisorCosts,
        business_expense: businessExpense,
        net_business_profit: netBusinessProfit,
        personal_expense: personalExpense,
        net_saving: netSaving
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Site-wise Profit
router.get('/site-wise', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [rows] = await pool.query(
      `SELECT s.site_name, 
        SUM(a.company_bill) as company_bill,
        SUM(a.our_payment) as labour_payment,
        SUM(a.profit) as profit,
        COUNT(DISTINCT a.labour_id) as labour_count,
        SUM(a.total_hajri) as total_hajri
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE DATE_FORMAT(a.date, '%Y-%m') = ?
       GROUP BY a.site_id, s.site_name`,
      [targetMonth]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Category-wise Profit
router.get('/category-wise', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [rows] = await pool.query(
      `SELECT lc.category_name, lc.category_code,
        SUM(a.profit) as profit,
        COUNT(DISTINCT a.labour_id) as labour_count,
        SUM(a.total_hajri) as total_hajri
       FROM attendance a
       JOIN labour l ON a.labour_id = l.id
       JOIN labour_categories lc ON l.category_id = lc.id
       WHERE DATE_FORMAT(a.date, '%Y-%m') = ?
       GROUP BY lc.id, lc.category_name, lc.category_code`,
      [targetMonth]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Daily Profit Trend
router.get('/daily-trend', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [rows] = await pool.query(
      `SELECT date, 
        SUM(company_bill) as company_bill,
        SUM(our_payment) as labour_payment,
        SUM(profit) as profit,
        SUM(total_hajri) as total_hajri,
        COUNT(DISTINCT labour_id) as present_labour
       FROM attendance
       WHERE DATE_FORMAT(date, '%Y-%m') = ?
       GROUP BY date
       ORDER BY date`,
      [targetMonth]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Ghost Hajri Summary
router.get('/ghost-hajri', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [rows] = await pool.query(
      `SELECT s.site_name, 
        SUM(a.company_bill) as company_bill,
        SUM(a.our_payment) as labour_payment,
        SUM(a.profit) as profit,
        SUM(a.total_hajri) as total_company_hajri,
        SUM(a.regular_hajri + a.ot_hajri) as total_labour_hajri,
        (SUM(a.total_hajri) - SUM(a.regular_hajri + a.ot_hajri)) as ghost_hajri
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE DATE_FORMAT(a.date, '%Y-%m') = ?
       GROUP BY a.site_id, s.site_name`,
      [targetMonth]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;