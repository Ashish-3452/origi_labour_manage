const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Calculate Theka Profit
router.post('/calculate', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { company_hajri, company_rate, labour_hajri_per_person, labour_rate, num_labours } = req.body;

    const companyBill = company_hajri * company_rate;
    const totalLabourHajri = labour_hajri_per_person * num_labours;
    const labourPayment = totalLabourHajri * labour_rate;
    const profit = companyBill - labourPayment;
    const profitPercent = companyBill > 0 ? ((profit / companyBill) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        company_bill: companyBill,
        total_labour_hajri: totalLabourHajri,
        labour_payment: labourPayment,
        profit: profit,
        profit_percentage: parseFloat(profitPercent),
        is_profitable: profit >= 0
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Theka Work
router.post('/save', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { work_description, site_id, work_date, work_type,
            company_hajri, company_rate_per_hajri, company_total_bill,
            labour_hajri_per_person, labour_rate_per_hajri, num_labours,
            total_labour_hajri, labour_payment, profit, profit_percentage } = req.body;

    const [result] = await pool.query(
      `INSERT INTO theka_work (work_description, site_id, work_date, work_type,
        company_hajri, company_rate_per_hajri, company_total_bill,
        labour_hajri_per_person, labour_rate_per_hajri, number_of_labours,
        total_labour_hajri, total_labour_payment, profit_loss, profit_percentage,
        is_profitable, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [work_description, site_id, work_date, work_type,
       company_hajri, company_rate_per_hajri, company_total_bill,
       labour_hajri_per_person, labour_rate_per_hajri, num_labours,
       total_labour_hajri, labour_payment, profit,
       profit_percentage, profit >= 0, req.user.id]
    );

    res.status(201).json({ success: true, id: result.insertId, message: 'Theka work saved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Theka History
router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.query(
      `SELECT t.*, s.site_name FROM theka_work t
       JOIN sites s ON t.site_id = s.id
       ORDER BY t.work_date DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;