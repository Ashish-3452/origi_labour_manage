const { pool } = require('../config/database');

class Khoraki {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS khoraki (
        id INT PRIMARY KEY AUTO_INCREMENT,
        labour_id INT NOT NULL,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        total_hajri DECIMAL(5,2) DEFAULT 0,
        khoraki_rate DECIMAL(10,2) DEFAULT 250,
        total_khoraki DECIMAL(10,2) DEFAULT 0,
        advance_deducted DECIMAL(10,2) DEFAULT 0,
        net_payable DECIMAL(10,2) DEFAULT 0,
        paid_date DATE,
        receipt_no VARCHAR(50),
        status ENUM('PENDING', 'PAID') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labour_id) REFERENCES labour(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(query);
  }
}

module.exports = Khoraki;