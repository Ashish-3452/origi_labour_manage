const { pool } = require('../config/database');

class Expense {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_id INT,
        expense_type ENUM('BUSINESS', 'PERSONAL') NOT NULL DEFAULT 'BUSINESS',
        category_name VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        paid_to VARCHAR(100),
        payment_mode ENUM('CASH', 'UPI', 'BANK_TRANSFER') DEFAULT 'CASH',
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(query);
  }
}

module.exports = Expense;