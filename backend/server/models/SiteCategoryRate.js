const { pool } = require('../config/database');

class SiteCategoryRate {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS site_category_rates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_id INT NOT NULL,
        category_id INT NOT NULL,
        company_rate_8hr DECIMAL(10,2) NOT NULL,
        company_ot_rate_hr DECIMAL(10,2) NOT NULL,
        our_rate_8hr DECIMAL(10,2) NOT NULL,
        our_ot_rate_hr DECIMAL(10,2) NOT NULL,
        UNIQUE KEY unique_site_category (site_id, category_id),
        FOREIGN KEY (site_id) REFERENCES sites(id),
        FOREIGN KEY (category_id) REFERENCES labour_categories(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(query);
    console.log('  ✅ Site Category Rates table');
  }

  static async saveRate(data) {
    const { site_id, category_id, company_rate, company_ot, our_rate, our_ot } = data;
    await pool.query(
      `INSERT INTO site_category_rates 
       (site_id, category_id, company_rate_8hr, company_ot_rate_hr, our_rate_8hr, our_ot_rate_hr)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       company_rate_8hr = VALUES(company_rate_8hr),
       company_ot_rate_hr = VALUES(company_ot_rate_hr),
       our_rate_8hr = VALUES(our_rate_8hr),
       our_ot_rate_hr = VALUES(our_ot_rate_hr)`,
      [site_id, category_id, company_rate, company_ot, our_rate, our_ot]
    );
  }

  static async getRatesBySite(site_id) {
    const [rows] = await pool.query(
      `SELECT scr.*, lc.category_name
       FROM site_category_rates scr
       JOIN labour_categories lc ON scr.category_id = lc.id
       WHERE scr.site_id = ?
       ORDER BY lc.category_name`,
      [site_id]
    );
    return rows;
  }

  static async getRate(site_id, category_id) {
    const [rows] = await pool.query(
      'SELECT * FROM site_category_rates WHERE site_id = ? AND category_id = ?',
      [site_id, category_id]
    );
    return rows[0];
  }
}

module.exports = SiteCategoryRate;