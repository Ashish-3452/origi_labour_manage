const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const mysqldump = require('mysqldump');
const fs = require('fs');
const path = require('path');

// Create Backup
router.post('/create', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    await mysqldump({
      connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'labour_management'
      },
      dumpToFile: filepath
    });

    res.json({ 
      success: true, 
      message: 'Backup created successfully!',
      filename: filename,
      path: filepath
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List Backups
router.get('/list', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => ({
        name: f,
        size: (fs.statSync(path.join(backupDir, f)).size / 1024).toFixed(2) + ' KB',
        date: fs.statSync(path.join(backupDir, f)).mtime
      }))
      .sort((a, b) => b.date - a.date);

    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download Backup
router.get('/download/:filename', authenticate, authorize('SUPER_ADMIN'), (req, res) => {
  const filepath = path.join(__dirname, '../../backups', req.params.filename);
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;