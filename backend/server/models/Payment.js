const { pool } = require('../config/database');

class Payment {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        labour_id INT NOT NULL,
        payment_type ENUM('ADVANCE', 'KHORAKI', 'SETTLEMENT', 'SALARY') NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        advance_deducted DECIMAL(10,2) DEFAULT 0,
        net_paid DECIMAL(10,2) NOT NULL,
        payment_mode ENUM('CASH', 'UPI', 'BANK_TRANSFER') DEFAULT 'CASH',
        transaction_ref VARCHAR(100),
        receipt_no VARCHAR(50) UNIQUE,
        status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PAID',
        payment_date DATE NOT NULL,
        period_start DATE,
        period_end DATE,
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_labour (labour_id),
        INDEX idx_date (payment_date),
        INDEX idx_type (payment_type),
        FOREIGN KEY (labour_id) REFERENCES labour(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('  ❌ Payments table:', err.message);
      throw err;
    }
  }

  static generateReceiptNo(type) {
    const prefix = type === 'ADVANCE' ? 'ADV' : type === 'KHORAKI' ? 'KHO' : 'SET';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }

  static async giveAdvance(data) {
    const { labour_id, amount, payment_mode, payment_date, remarks, created_by } = data;
    
    const receipt_no = this.generateReceiptNo('ADVANCE');
    
    // Insert payment record
    const [result] = await pool.query(
      `INSERT INTO payments (labour_id, payment_type, total_amount, net_paid, 
        payment_mode, receipt_no, payment_date, remarks, created_by)
       VALUES (?, 'ADVANCE', ?, ?, ?, ?, ?, ?, ?)`,
      [labour_id, amount, amount, payment_mode, receipt_no, payment_date, remarks, created_by]
    );
    
    // Update labour advance balance
    await pool.query(
      `UPDATE labour SET total_advance_taken = total_advance_taken + ? WHERE id = ?`,
      [amount, labour_id]
    );
    
    return { id: result.insertId, receipt_no };
  }
}

module.exports = Payment;