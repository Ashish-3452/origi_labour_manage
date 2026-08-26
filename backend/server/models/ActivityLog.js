const { pool } = require('../config/database');

class ActivityLog {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        action VARCHAR(100),
        description TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(query);
  }

  static async log(userId, action, description, ip) {
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, description, ip]
    );
  }

  static async getAll(limit = 100) {
    const [rows] = await pool.query(
      `SELECT a.*, u.name FROM activity_logs a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC LIMIT ?`, [limit]
    );
    return rows;
  }
}

module.exports = ActivityLog;