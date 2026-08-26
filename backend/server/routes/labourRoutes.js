const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Labour CRUD
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
  }
});

router.get('/list', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'), async (req, res) => {
  try {
    const Labour = require('../models/Labour');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const labour = await Labour.getAll({ ...req.query, limit, offset });
    const total = await Labour.getCount(req.query);
    
    res.json({
      success: true,
      data: labour,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// Categories
router.get('/categories/all', authenticate, async (req, res) => {
  try {
    const LabourCategory = require('../models/LabourCategory');
    const categories = await LabourCategory.getAll();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sites
router.get('/sites/all', authenticate, async (req, res) => {
  try {
    const Site = require('../models/Site');
    const sites = await Site.getAll();
    res.json({ success: true, data: sites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sites/create', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const Site = require('../models/Site');
    const siteId = await Site.create(req.body);
    res.status(201).json({ success: true, id: siteId, message: 'Site created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Site
router.post('/sites/create', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const Site = require('../models/Site');
    const id = await Site.create(req.body);
    res.status(201).json({ success: true, id, message: 'Site created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sites (already exists but confirm)
router.get('/sites/all', authenticate, async (req, res) => {
  try {
    const Site = require('../models/Site');
    const sites = await Site.getAll();
    res.json({ success: true, data: sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;