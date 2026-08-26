const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// Generate Monthly Bill PDF
router.get('/generate', async (req, res) => {
  try {
    // Token verify from URL
    const jwt = require('jsonwebtoken');
    const token = req.query.token;
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { pool } = require('../config/database');
    const { month, site_id } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    let siteFilter = '';
    let params = [targetMonth];
    if (site_id) { siteFilter = 'AND a.site_id = ?'; params.push(site_id); }

    // Get billing data
    const [billing] = await pool.query(
      `SELECT s.site_name, s.location, s.company_name,
        SUM(a.total_hajri) as total_hajri,
        SUM(a.company_bill) as total_bill,
        COUNT(DISTINCT a.labour_id) as labour_count,
        COUNT(DISTINCT a.date) as working_days
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE DATE_FORMAT(a.date, '%Y-%m') = ? ${siteFilter}
       GROUP BY a.site_id, s.site_name, s.location, s.company_name`,
      params
    );

    // Get daily breakdown
    const [daily] = await pool.query(
      `SELECT a.date, 
        COUNT(DISTINCT a.labour_id) as labour_count,
        SUM(a.total_hajri) as hajri,
        SUM(a.company_bill) as amount
       FROM attendance a
       WHERE DATE_FORMAT(a.date, '%Y-%m') = ? ${siteFilter}
       GROUP BY a.date ORDER BY a.date`,
      params
    );

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill_${targetMonth}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('LABOUR SUPPLY BILL', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text('Ashish Labour Contractor', { align: 'center' });
    doc.text('📞 9876543210 | ✉️ ashish@contractor.com', { align: 'center' });
    doc.moveDown(1);

    // Bill Info
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Bill Month: ${targetMonth}`);
    doc.text(`Bill Date: ${new Date().toLocaleDateString('hi-IN')}`);
    if (billing[0]) {
      doc.text(`Site: ${billing[0].site_name}`);
      doc.text(`Company: ${billing[0].company_name || 'N/A'}`);
    }
    doc.moveDown(1);

    // Summary
    doc.font('Helvetica-Bold').text('SUMMARY', { underline: true });
    doc.moveDown(0.5);
    if (billing[0]) {
      doc.font('Helvetica');
      doc.text(`Working Days: ${billing[0].working_days}`);
      doc.text(`Labour Count: ${billing[0].labour_count}`);
      doc.text(`Total Hajri: ${Number(billing[0].total_hajri).toFixed(2)}`);
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text(`TOTAL: ₹${Number(billing[0].total_bill).toLocaleString('en-IN')}`, { underline: true });
    }
    doc.moveDown(1);

    // Daily Breakdown
    doc.fontSize(11).font('Helvetica-Bold').text('DAILY BREAKDOWN', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Date', 50, tableTop);
    doc.text('Labour', 200, tableTop);
    doc.text('Hajri', 300, tableTop);
    doc.text('Amount', 400, tableTop);
    doc.moveDown(0.5);

    doc.font('Helvetica');
    daily.forEach(row => {
      const y = doc.y;
      doc.text(new Date(row.date).toLocaleDateString('hi-IN'), 50, y);
      doc.text(String(row.labour_count), 200, y);
      doc.text(Number(row.hajri).toFixed(2), 300, y);
      doc.text(`₹${Number(row.amount).toLocaleString('en-IN')}`, 400, y);
      doc.moveDown(0.3);
    });

    doc.moveDown(2);
    doc.font('Helvetica');
    doc.text('Authorized Signature', { align: 'right' });
    doc.moveDown(2);
    doc.text('Ashish Contractor', { align: 'right' });

    doc.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;