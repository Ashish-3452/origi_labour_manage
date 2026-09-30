const { pool } = require('../config/database');

class BillPayment {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS bill_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        bill_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_mode ENUM('CASH','UPI','BANK_TRANSFER','CHEQUE') DEFAULT 'BANK_TRANSFER',
        reference_no VARCHAR(100),
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_bill (bill_id),
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await pool.query(query);
      console.log('  ✅ Bill Payments table');
    } catch (err) {
      console.error('  ❌ Bill Payments table:', err.message);
      throw err;
    }
  }
}

module.exports = BillPayment;