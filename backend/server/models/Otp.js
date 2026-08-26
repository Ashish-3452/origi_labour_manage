const { pool } = require('../config/database');

class Otp {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS otps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        mobile VARCHAR(10) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mobile_otp (mobile, otp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(query);
    console.log('  ✅ OTP table ready');
  }

  static async saveOtp(mobile, otp) {
    // Delete old OTPs
    await pool.query('DELETE FROM otps WHERE mobile = ?', [mobile]);
    
    // Expiry 10 minutes
    await pool.query(
      'INSERT INTO otps (mobile, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [mobile, otp]
    );
  }

  static async verifyOtp(mobile, otp) {
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE mobile = ? AND otp = ? AND is_used = FALSE AND expires_at > NOW()',
      [mobile, otp]
    );
    
    if (rows.length > 0) {
      await pool.query('UPDATE otps SET is_used = TRUE WHERE id = ?', [rows[0].id]);
      return true;
    }
    return false;
  }
}

module.exports = Otp;