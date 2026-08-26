const { pool } = require('../config/database');

class Supervisor {
  
  // ==========================================
  // TABLE 1: Supervisors Table
  // ==========================================
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS supervisors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(10) UNIQUE,
        aadhar_no VARCHAR(12),
        address TEXT,
        photo_path VARCHAR(255),
        assigned_site_id INT,
        joining_date DATE NOT NULL,
        exit_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        in_hand_salary DECIMAL(10,2) NOT NULL DEFAULT 15000,
        khoraki_allowance DECIMAL(10,2) DEFAULT 3000,
        mobile_allowance DECIMAL(10,2) DEFAULT 500,
        travel_allowance DECIMAL(10,2) DEFAULT 1500,
        accommodation_allowance DECIMAL(10,2) DEFAULT 2000,
        total_advance_taken DECIMAL(10,2) DEFAULT 0,
        total_advance_recovered DECIMAL(10,2) DEFAULT 0,
        user_id INT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_site_id) REFERENCES sites(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('  ❌ Supervisors table:', err.message);
      throw err;
    }
  }

  // ==========================================
  // TABLE 2: Supervisor Advances Table
  // ==========================================
  static async createAdvanceTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS supervisor_advances (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supervisor_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        remarks TEXT,
        payment_date DATE NOT NULL,
        recovered DECIMAL(10,2) DEFAULT 0,
        status ENUM('ACTIVE', 'RECOVERED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('  ❌ Supervisor Advances table:', err.message);
      throw err;
    }
  }
}

module.exports = Supervisor;