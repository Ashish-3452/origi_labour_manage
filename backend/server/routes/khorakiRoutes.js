const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// Get labour list for khoraki entry (by site)
router.get('/labour-list', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { site_id, date } = req.query;
    
    const [labour] = await pool.query(
      `SELECT l.id, l.name, l.labour_code, lc.category_name,
              k.id as khoraki_id, k.total_khoraki as existing_amount
       FROM labour l
       JOIN labour_categories lc ON l.category_id = lc.id
       LEFT JOIN khoraki k ON k.labour_id = l.id AND k.week_start = ?
       WHERE l.is_active = TRUE AND l.site_id = ?
       ORDER BY l.name ASC`,
      [date, site_id]
    );

    res.json({ success: true, data: labour });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch Save Khoraki Entries
router.post('/batch-save', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const { site_id, date, entries } = req.body;
    
    if (!site_id || !date || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid data' });
    }

    const receipt_no_prefix = 'KHO-' + Date.now().toString(36).toUpperCase();
    let savedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const { labour_id, amount } = entries[i];
      
      if (!labour_id || amount === undefined || amount === '') continue;

      const receipt_no = `${receipt_no_prefix}-${i + 1}`;
      const net_payable = parseFloat(amount);

      // Upsert khoraki entry (same date + labour = update, else insert)
      await pool.query(
        `INSERT INTO khoraki (labour_id, week_start, week_end, total_khoraki, advance_deducted, net_payable, paid_date, receipt_no, status)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'PAID')
         ON DUPLICATE KEY UPDATE
           total_khoraki = VALUES(total_khoraki),
           net_payable = VALUES(net_payable),
           paid_date = CURDATE(),
           receipt_no = VALUES(receipt_no)`,
        [labour_id, date, date, amount, net_payable, receipt_no]
      );
      savedCount++;
    }

    res.json({ 
      success: true, 
      message: `Khoraki saved for ${savedCount} labour!`,
      saved: savedCount 
    });

  } catch (err) {
    console.error('Batch khoraki error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;