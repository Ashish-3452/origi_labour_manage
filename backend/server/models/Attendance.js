const { pool } = require('../config/database');
const { getLabourRate } = require('../utils/rateResolver');

class Attendance {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        labour_id INT NOT NULL,
        date DATE NOT NULL,
        site_id INT,
        regular_hours DECIMAL(4,1) DEFAULT 8,
        overtime_hours DECIMAL(4,1) DEFAULT 0,
        regular_hajri DECIMAL(4,2) DEFAULT 1,
        ot_hajri DECIMAL(4,2) DEFAULT 0,
        total_hajri DECIMAL(4,2) DEFAULT 1,
        company_bill DECIMAL(10,2) DEFAULT 0,
        our_payment DECIMAL(10,2) DEFAULT 0,
        profit DECIMAL(10,2) DEFAULT 0,
        status ENUM('present', 'absent', 'half_day') DEFAULT 'present',
        marked_by INT,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_attendance (labour_id, date),
        INDEX idx_date (date),
        INDEX idx_site (site_id),
        FOREIGN KEY (labour_id) REFERENCES labour(id),
        FOREIGN KEY (site_id) REFERENCES sites(id),
        FOREIGN KEY (marked_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(query);
      console.log('  ✅ Attendance table');
    } catch (err) {
      console.error('  ❌ Attendance table:', err.message);
      throw err;
    }
  }

  // Mark attendance with site-specific rate resolution
  static async markAttendance(data) {
  const { labour_id, date, regular_hours, overtime_hours, site_id, marked_by } = data;
  
  const regHrs = regular_hours || 8;
  const otHrs = overtime_hours || 0;
  const regularHajri = regHrs / 8;
  const otHajri = otHrs / 8;
  const totalHajri = regularHajri + otHajri;

  // 🔥 CATEGORY RATE SEEDHA LO (koi site-rate nahi)
  const [labourRate] = await pool.query(
    `SELECT lc.company_rate_8hr, lc.company_ot_rate_hr,
            lc.our_rate_8hr, lc.our_ot_rate_hr
     FROM labour l
     JOIN labour_categories lc ON l.category_id = lc.id
     WHERE l.id = ?`,
    [labour_id]
  );

  if (!labourRate.length) {
    throw new Error(`Labour ka rate nahi mila (ID: ${labour_id})`);
  }

  const rates = labourRate[0];
  const companyBill = (regularHajri * rates.company_rate_8hr) + (otHrs * rates.company_ot_rate_hr);
  const ourPayment = (regularHajri * rates.our_rate_8hr) + (otHrs * rates.our_ot_rate_hr);
  const profit = companyBill - ourPayment;
  const status = regHrs < 4 ? 'absent' : regHrs < 8 ? 'half_day' : 'present';

  const [result] = await pool.query(
    `INSERT INTO attendance (labour_id, date, regular_hours, overtime_hours,
      regular_hajri, ot_hajri, total_hajri, company_bill, our_payment, profit,
      site_id, status, marked_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      regular_hours=VALUES(regular_hours), overtime_hours=VALUES(overtime_hours),
      regular_hajri=VALUES(regular_hajri), ot_hajri=VALUES(ot_hajri),
      total_hajri=VALUES(total_hajri), company_bill=VALUES(company_bill),
      our_payment=VALUES(our_payment), profit=VALUES(profit),
      status=VALUES(status)`,
    [labour_id, date, regHrs, otHrs, regularHajri, otHajri, totalHajri,
     companyBill, ourPayment, profit, site_id, status, marked_by]
  );

  return {
    id: result.insertId,
    total_hajri: totalHajri,
    company_bill: companyBill,
    our_payment: ourPayment,
    profit: profit
  };
}
// Morning Preset: Subah sab active labour ko temporary present mark
static async markMorningPreset(site_id, date, marked_by) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const [labour] = await pool.query(
    'SELECT id FROM labour WHERE is_active = TRUE AND site_id = ?',
    [site_id]
  );

  const results = [];
  for (const lab of labour) {
    await pool.query(
      `INSERT INTO attendance (labour_id, date, site_id, regular_hours, overtime_hours, regular_hajri, ot_hajri, total_hajri, company_bill, our_payment, profit, status, marked_by, is_finalized)
       VALUES (?, ?, ?, 8, 0, 1, 0, 1, 0, 0, 0, 'present', ?, FALSE)
       ON DUPLICATE KEY UPDATE labour_id=labour_id`,
      [lab.id, targetDate, site_id, marked_by]
    );
    results.push(lab.id);
  }
  return { count: results.length };
}

// Finalize/Update Attendance (Shaam ka final status)
static async finalizeAttendance(data) {
  const { labour_id, date, regular_hours, overtime_hours, status, marked_by } = data;
  const regHrs = regular_hours || 0;
  const otHrs = overtime_hours || 0;

  const [labourRate] = await pool.query(
    `SELECT lc.company_rate_8hr, lc.company_ot_rate_hr,
            lc.our_rate_8hr, lc.our_ot_rate_hr
     FROM labour l
     JOIN labour_categories lc ON l.category_id = lc.id
     WHERE l.id = ?`,
    [labour_id]
  );
  if (!labourRate.length) throw new Error('Labour rate not found');
  const rates = labourRate[0];

  const regularHajri = regHrs / 8;
  const otHajri = otHrs / 8;
  const totalHajri = regularHajri + otHajri;
  const companyBill = (regularHajri * rates.company_rate_8hr) + (otHrs * rates.company_ot_rate_hr);
  const ourPayment = (regularHajri * rates.our_rate_8hr) + (otHrs * rates.our_ot_rate_hr);
  const profit = companyBill - ourPayment;

  await pool.query(
    `UPDATE attendance SET
      regular_hours = ?, overtime_hours = ?,
      regular_hajri = ?, ot_hajri = ?, total_hajri = ?,
      company_bill = ?, our_payment = ?, profit = ?,
      status = ?, is_finalized = TRUE
     WHERE labour_id = ? AND date = ?`,
    [regHrs, otHrs, regularHajri, otHajri, totalHajri, companyBill, ourPayment, profit, status, labour_id, date]
  );

  return { success: true };
}

// Attendance list for a date/site
static async getList(date, site_id) {
  const query = `
    SELECT a.*, l.name, l.labour_code, lc.category_name, s.site_name
    FROM attendance a
    JOIN labour l ON a.labour_id = l.id
    JOIN labour_categories lc ON l.category_id = lc.id
    JOIN sites s ON a.site_id = s.id
    WHERE a.date = ? AND a.site_id = ?
  `;
  const [rows] = await pool.query(query, [date, site_id]);
  return rows;
}

}
module.exports = Attendance;