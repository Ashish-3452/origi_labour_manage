const { pool } = require('../config/database');

class User {
  
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(10) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR') NOT NULL DEFAULT 'SUPERVISOR',
        assigned_site_id INT NULL,
        permissions JSON NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login DATETIME NULL,
        login_count INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_site (assigned_site_id),
        INDEX idx_creator (created_by),
        FOREIGN KEY (assigned_site_id) REFERENCES sites(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.query(query);
      
    } catch (err) {
      console.error('❌ Error creating users table:', err.message);
      throw err; // ← ADD THIS LINE
    }
  }
  // Create default Super Admin
  static async createDefaultAdmin() {
    try {
      const bcrypt = require('bcryptjs');
      
      // Check if admin exists
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE mobile = ?',
        ['9876543210']
      );

      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        await pool.query(
          `INSERT INTO users (name, mobile, email, password, role, permissions) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            'Ashish',
            '9876543210',
            'ashish@contractor.com',
            hashedPassword,
            'SUPER_ADMIN',
            JSON.stringify({
              can_create_admin: true,
              can_delete_admin: true,
              can_manage_system: true,
              can_view_all_data: true,
              can_delete_data: true,
              can_export_data: true,
              can_manage_sites: true,
              can_change_rates: true,
              can_view_profit: true,
              can_create_bills: true
            })
          ]
        );
        console.log('✅ Default Super Admin created');
        console.log('📱 Mobile: 9876543210');
        console.log('🔑 Password: admin123');
      } else {
        console.log('✅ Super Admin already exists');
      }
    } catch (err) {
      console.error('❌ Error creating admin:', err.message);
    }
  }

  // Find user by mobile
  static async findByMobile(mobile) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE mobile = ? AND is_active = TRUE',
      [mobile]
    );
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, mobile, email, role, assigned_site_id, permissions, is_active, last_login, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Create new user
  static async create(userData) {
    const { name, mobile, email, password, role, assigned_site_id, permissions, created_by } = userData;
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await pool.query(
      `INSERT INTO users (name, mobile, email, password, role, assigned_site_id, permissions, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile, email, hashedPassword, role, assigned_site_id, JSON.stringify(permissions), created_by]
    );
    
    return result.insertId;
  }

  // Update last login
  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?',
      [userId]
    );
  }

  // Get all users (for admin management)
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT id, name, mobile, email, role, assigned_site_id, is_active, last_login, login_count, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  // Toggle user active status
  static async toggleStatus(userId, isActive) {
    await pool.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, userId]
    );
  }
}

module.exports = User;