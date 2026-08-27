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
    
    // 🔥 Resolve rate: site-specific first, then category default
    const rates = await getLabourRate(labour_id, site_id);
    
    if (!rates) {
      throw new Error('Labour rate not found');
    }
    
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
}

module.exports = Attendance;