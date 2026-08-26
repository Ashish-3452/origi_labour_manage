const { pool } = require('../config/database');

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
      
    } catch (err) {
      console.error('  ❌ Attendance table:', err.message);
      throw err;
    }
  }

  static async markAttendance(data) {
    const { labour_id, date, regular_hours, overtime_hours, site_id, marked_by } = data;
    
    const regHrs = regular_hours || 8;
    const otHrs = overtime_hours || 0;
    const totalHrs = regHrs + otHrs;
    
    const regularHajri = regHrs / 8;
    const otHajri = otHrs / 8;
    const totalHajri = regularHajri + otHajri;
    
    // Get labour rates
    const [labour] = await pool.query(
      `SELECT l.*, lc.company_rate_8hr, lc.company_ot_rate_hr,
              lc.our_rate_8hr, lc.our_ot_rate_hr
       FROM labour l
       JOIN labour_categories lc ON l.category_id = lc.id
       WHERE l.id = ?`, [labour_id]
    );
    
    if (!labour.length) throw new Error('Labour not found');
    
    const rates = labour[0];
    
    const companyBill = (regularHajri * rates.company_rate_8hr) + (otHrs * rates.company_ot_rate_hr);
    const ourPayment = (regularHajri * rates.our_rate_8hr) + (otHrs * rates.our_ot_rate_hr);
    const profit = companyBill - ourPayment;
    
    const status = regular_hours < 4 ? 'absent' : regular_hours < 8 ? 'half_day' : 'present';
    
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