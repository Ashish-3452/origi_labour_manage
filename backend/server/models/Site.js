const { pool } = require('../config/database');

class Site {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS sites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_name VARCHAR(200) NOT NULL,
        site_code VARCHAR(20) UNIQUE,
        location TEXT,
        company_name VARCHAR(200),
        company_contact VARCHAR(15),
        gst_number VARCHAR(15),
        billing_address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('  ❌ Sites table:', err.message);
      throw err;
    }
  }

  static async createDefault() {
    try {
      const [existing] = await pool.query('SELECT id FROM sites LIMIT 1');
      
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO sites (site_name, site_code, location) VALUES (?, ?, ?)`,
          ['Default Site', 'SITE001', 'Main Location']
        );
        console.log('✅ Default site created');
      }
    } catch (err) {
      console.error('❌ Error creating default site:', err.message);
    }
  }

  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM sites WHERE is_active = TRUE ORDER BY site_name');
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(siteData) {
    const { site_name, site_code, location, company_name, company_contact } = siteData;
    const [result] = await pool.query(
      `INSERT INTO sites (site_name, site_code, location, company_name, company_contact) VALUES (?, ?, ?, ?, ?)`,
      [site_name, site_code, location, company_name, company_contact]
    );
    return result.insertId;
  }
}

module.exports = Site;