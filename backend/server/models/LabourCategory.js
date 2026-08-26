const { pool } = require('../config/database');

class LabourCategory {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS labour_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(50) NOT NULL,
        category_code VARCHAR(10) UNIQUE NOT NULL,
        company_rate_8hr DECIMAL(10,2) NOT NULL DEFAULT 500,
        company_ot_rate_hr DECIMAL(10,2) NOT NULL DEFAULT 62.50,
        our_rate_8hr DECIMAL(10,2) NOT NULL DEFAULT 400,
        our_ot_rate_hr DECIMAL(10,2) NOT NULL DEFAULT 50,
        khoraki_rate DECIMAL(10,2) NOT NULL DEFAULT 250,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('  ❌ Labour Categories table:', err.message);
      throw err;
    }
  }

  static async createDefaults() {
    const categories = [
      { name: 'Man Labour', code: 'MAN', company_rate: 500, company_ot: 62.50, our_rate: 400, our_ot: 50, khoraki: 250 },
      { name: 'Ladies Labour', code: 'LAD', company_rate: 450, company_ot: 56.25, our_rate: 350, our_ot: 43.75, khoraki: 250 },
      { name: 'Mason (Mistri)', code: 'MAS', company_rate: 800, company_ot: 100, our_rate: 650, our_ot: 81.25, khoraki: 300 },
      { name: 'Carpenter', code: 'CAR', company_rate: 700, company_ot: 87.50, our_rate: 550, our_ot: 68.75, khoraki: 300 }
    ];

    try {
      for (const cat of categories) {
        await pool.query(
          `INSERT IGNORE INTO labour_categories 
           (category_name, category_code, company_rate_8hr, company_ot_rate_hr, 
            our_rate_8hr, our_ot_rate_hr, khoraki_rate) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cat.name, cat.code, cat.company_rate, cat.company_ot, cat.our_rate, cat.our_ot, cat.khoraki]
        );
      }
      console.log('✅ Default labour categories created');
    } catch (err) {
      console.error('❌ Error creating categories:', err.message);
    }
  }

  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM labour_categories WHERE is_active = TRUE ORDER BY category_name');
    return rows;
  }
}

module.exports = LabourCategory;