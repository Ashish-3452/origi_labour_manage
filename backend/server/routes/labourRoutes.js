const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// ============ LABOUR CRUD ============
router.post('/register', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const Labour = require('../models/Labour');
    const result = await Labour.create(req.body);
    const { pool } = require('../config/database');
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'LABOUR_ADD', `Registered new labour: ${req.body.name}`, req.ip]
    );
    res.status(201).json({ success: true, data: result, message: 'Labour registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
    const msg = err.message.includes('already registered')
    ? err.message
    : 'Server error. Please try again.';
  res.status(400).json({ success: false, error: msg });
  }
});

// ⚠️ Specific routes PEHLE (before /:id)
router.get('/inactive', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const Labour = require('../models/Labour');
    const inactive = await Labour.getInactiveLabour();
    res.json({ success: true, data: inactive });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/active-count', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Labour = require('../models/Labour');
    const count = await Labour.getActiveCount();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/toggle-status/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { is_active } = req.body;
    await pool.query('UPDATE labour SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
    res.json({ success: true, message: 'Labour status updated!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Labour = require('../models/Labour');
    const filters = {
      site_id: req.query.site_id || null,
      category_id: req.query.category_id || null,
      search: req.query.search || null
    };
    const labour = await Labour.getAll(filters);
    res.json({ success: true, count: labour.length, data: labour });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ SITE RATES ============
router.get('/site-rates/:labourId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const LabourSiteRate = require('../models/LabourSiteRate');
    const rates = await LabourSiteRate.getAllForLabour(req.params.labourId);
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/site-rate', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const LabourSiteRate = require('../models/LabourSiteRate');
    await LabourSiteRate.saveRate(req.body);
    res.json({ success: true, message: 'Site rate saved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CATEGORIES & SITES ============
router.get('/categories/all', authenticate, async (req, res) => {
  try {
    const LabourCategory = require('../models/LabourCategory');
    const categories = await LabourCategory.getAll();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sites/all', authenticate, async (req, res) => {
  try {
    const Site = require('../models/Site');
    const sites = await Site.getAll();
    res.json({ success: true, data: sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sites/create', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const Site = require('../models/Site');
    const id = await Site.create(req.body);
    res.status(201).json({ success: true, id, message: 'Site created successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/sites/update/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const Site = require('../models/Site');
    await Site.update(req.params.id, req.body);
    res.json({ success: true, message: 'Site updated successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/sites/delete/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const Site = require('../models/Site');
    await Site.delete(req.params.id);
    res.json({ success: true, message: 'Site deleted successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ⚠️ YE ROUTE SABSE LAST ME HONA CHAHIYE (/:id generic hai)
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Labour = require('../models/Labour');
    const labour = await Labour.getById(req.params.id);
    if (!labour) return res.status(404).json({ success: false, error: 'Labour not found' });
    res.json({ success: true, data: labour });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;