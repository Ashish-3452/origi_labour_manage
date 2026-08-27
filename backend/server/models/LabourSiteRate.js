const { pool } = require('../config/database');

class LabourSiteRate {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS labour_site_rates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        labour_id INT NOT NULL,
        site_id INT NOT NULL,
        company_rate_8hr DECIMAL(10,2) NOT NULL,
        company_ot_rate_hr DECIMAL(10,2) NOT NULL,
        our_rate_8hr DECIMAL(10,2) NOT NULL,
        our_ot_rate_hr DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_labour_site (labour_id, site_id),
        FOREIGN KEY (labour_id) REFERENCES labour(id),
        FOREIGN KEY (site_id) REFERENCES sites(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(query);
    console.log('  ✅ Labour Site Rates table');
  }

  static async getRate(labour_id, site_id) {
    const [rows] = await pool.query(
      `SELECT * FROM labour_site_rates 
       WHERE labour_id = ? AND site_id = ? AND is_active = TRUE`,
      [labour_id, site_id]
    );
    return rows[0];
  }

  static async saveRate(data) {
    const { labour_id, site_id, company_rate, company_ot, our_rate, our_ot } = data;
    
    await pool.query(
      `INSERT INTO labour_site_rates 
       (labour_id, site_id, company_rate_8hr, company_ot_rate_hr, our_rate_8hr, our_ot_rate_hr)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       company_rate_8hr = VALUES(company_rate_8hr),
       company_ot_rate_hr = VALUES(company_ot_rate_hr),
       our_rate_8hr = VALUES(our_rate_8hr),
       our_ot_rate_hr = VALUES(our_ot_rate_hr)`,
      [labour_id, site_id, company_rate, company_ot, our_rate, our_ot]
    );
  }
  static async getAllForLabour(labourId) {
  const [rows] = await pool.query(
    `SELECT lsr.*, s.site_name 
     FROM labour_site_rates lsr
     JOIN sites s ON lsr.site_id = s.id
     WHERE lsr.labour_id = ? AND lsr.is_active = TRUE
     ORDER BY s.site_name`,
    [labourId]
  );
  return rows;
}
}



module.exports = LabourSiteRate;