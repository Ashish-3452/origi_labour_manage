const { pool } = require('../config/database');

class FoodAdvance {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS food_advances (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_id INT NOT NULL,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        given_date DATE NOT NULL,
        given_to VARCHAR(100),
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_site_date (site_id, given_date),
        FOREIGN KEY (site_id) REFERENCES sites(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await pool.query(query);
      console.log('  ✅ Food Advances table');
    } catch (err) {
      console.error('  ❌ Food Advances table:', err.message);
      throw err;
    }
  }
}

module.exports = FoodAdvance;