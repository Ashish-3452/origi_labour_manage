const { pool } = require('../config/database');

class Bill {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS bills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_id INT NOT NULL,
        bill_no VARCHAR(50) UNIQUE,
        bill_date DATE NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        bill_amount DECIMAL(12,2) NOT NULL,
        food_advance_deducted DECIMAL(10,2) DEFAULT 0,
        other_deductions DECIMAL(10,2) DEFAULT 0,
        net_payable DECIMAL(12,2) NOT NULL,
        amount_received DECIMAL(12,2) DEFAULT 0,
        balance DECIMAL(12,2) DEFAULT 0,
        status ENUM('PENDING', 'PARTIAL', 'PAID') DEFAULT 'PENDING',
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_site (site_id),
        INDEX idx_status (status),
        INDEX idx_period (period_start, period_end),
        FOREIGN KEY (site_id) REFERENCES sites(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await pool.query(query);
      console.log('  ✅ Bills table');
    } catch (err) {
      console.error('  ❌ Bills table:', err.message);
      throw err;
    }
  }
}

module.exports = Bill;