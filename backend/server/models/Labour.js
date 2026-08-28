const { pool } = require('../config/database');

class Labour {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS labour (
        id INT PRIMARY KEY AUTO_INCREMENT,
        labour_code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(10),
        aadhar_no VARCHAR(12),
        address TEXT,
        photo_path VARCHAR(255),
        category_id INT NOT NULL,
        site_id INT NOT NULL,
        emergency_contact VARCHAR(15),
        bank_account VARCHAR(20),
        ifsc_code VARCHAR(15),
        is_active BOOLEAN DEFAULT TRUE,
        total_advance_taken DECIMAL(10,2) DEFAULT 0,
        total_advance_recovered DECIMAL(10,2) DEFAULT 0,
        registration_date DATE DEFAULT (CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_site (site_id),
        FOREIGN KEY (category_id) REFERENCES labour_categories(id),
        FOREIGN KEY (site_id) REFERENCES sites(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('  ❌ Labour table:', err.message);
      throw err;
    }
  }

  static generateCode() {
    return `LAB${Math.floor(1000 + Math.random() * 9000)}`;
  }

  static async create(labourData) {
    const { name, mobile, aadhar_no, address, category_id, site_id, emergency_contact } = labourData;
    const labour_code = this.generateCode();
    
    const [result] = await pool.query(
      `INSERT INTO labour (labour_code, name, mobile, aadhar_no, address, category_id, site_id, emergency_contact) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [labour_code, name, mobile, aadhar_no, address, category_id, site_id, emergency_contact]
    );
    
    return { id: result.insertId, labour_code };
  }

  static async getAll(filters = {}) {
  let query = `
    SELECT l.id, l.labour_code, l.name, l.mobile, l.address,
           lc.category_name, lc.category_code,
           lc.company_rate_8hr, lc.our_rate_8hr, lc.khoraki_rate,
           s.site_name
    FROM labour l
    LEFT JOIN labour_categories lc ON l.category_id = lc.id
    LEFT JOIN sites s ON l.site_id = s.id
    WHERE l.is_active = TRUE
  `;
  const params = [];

  if (filters.site_id) {
    query += ' AND l.site_id = ?';
    params.push(filters.site_id);
  }
  if (filters.category_id) {
    query += ' AND l.category_id = ?';
    params.push(filters.category_id);
  }
  if (filters.search) {
    query += ' AND (l.name LIKE ? OR l.mobile LIKE ? OR l.labour_code LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY l.name ASC';
  const [rows] = await pool.query(query, params);
  return rows;
}

  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT l.*, lc.category_name, lc.category_code,
              lc.company_rate_8hr, lc.company_ot_rate_hr,
              lc.our_rate_8hr, lc.our_ot_rate_hr, lc.khoraki_rate,
              s.site_name
       FROM labour l
       JOIN labour_categories lc ON l.category_id = lc.id
       JOIN sites s ON l.site_id = s.id
       WHERE l.id = ?`, [id]
    );
    return rows[0];
  }
}

module.exports = Labour;