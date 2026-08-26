const { pool } = require('../config/database');

class ThekaWork {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS theka_work (
        id INT PRIMARY KEY AUTO_INCREMENT,
        work_description TEXT,
        site_id INT NOT NULL,
        work_date DATE NOT NULL,
        work_type ENUM('REGULAR', 'THEKA', 'URGENT', 'OVERTIME_BULK') DEFAULT 'THEKA',
        company_hajri DECIMAL(6,2) NOT NULL,
        company_rate_per_hajri DECIMAL(10,2) NOT NULL,
        company_total_bill DECIMAL(10,2) NOT NULL,
        labour_hajri_per_person DECIMAL(5,2) NOT NULL,
        labour_rate_per_hajri DECIMAL(10,2) NOT NULL,
        number_of_labours INT NOT NULL DEFAULT 1,
        total_labour_hajri DECIMAL(6,2) NOT NULL,
        total_labour_payment DECIMAL(10,2) NOT NULL,
        profit_loss DECIMAL(10,2) NOT NULL,
        profit_percentage DECIMAL(5,2) NOT NULL,
        is_profitable BOOLEAN NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(query);
  }
}

module.exports = ThekaWork;