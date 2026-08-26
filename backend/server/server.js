const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
const Site = require('./models/Site');
const LabourCategory = require('./models/LabourCategory');
const Labour = require('./models/Labour');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Payment = require('./models/Payment');
const Khoraki = require('./models/Khoraki');
const Supervisor = require('./models/Supervisor');
const Expense = require('./models/Expense');
const ThekaWork = require('./models/ThekaWork');
const ActivityLog = require('./models/ActivityLog');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Security
app.use(helmet());
// Trust proxy for Hostinger
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://labourbhai.online'],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many login attempts. Try again later.' }
});

// API Test Route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API working perfectly!',
    database: 'Connected'
  });
});

// Login limiter
app.use('/api/auth/login', loginLimiter);

// Serve Frontend from public folder
app.use(express.static(path.join(__dirname, 'public')));
// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/labour', require('./routes/labourRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/khoraki', require('./routes/khorakiRoutes'));
app.use('/api/supervisors', require('./routes/supervisorRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/profit', require('./routes/profitRoutes'));
app.use('/api/bill', require('./routes/billRoutes'));
app.use('/api/theka', require('./routes/thekaRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));



// Frontend fallback (SPA)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    try {
      console.log('📦 Creating tables...');
      await Site.createTable();
      await LabourCategory.createTable();
      await User.createTable();
      await Labour.createTable();
      await Attendance.createTable();
      await Payment.createTable();
      await Khoraki.createTable();
      await Supervisor.createTable();
      await Supervisor.createAdvanceTable();
      await Expense.createTable();
      await ThekaWork.createTable();
      await ActivityLog.createTable();
      
      console.log('📦 Inserting default data...');
      await Site.createDefault();
      await LabourCategory.createDefaults();
      await User.createDefaultAdmin();
      
      console.log('✅ All tables ready!');
      
    } catch (err) {
      console.error('❌ Setup error:', err.message);
    }
  }
// Serve Frontend
app.use(express.static(__dirname));

  app.listen(PORT, () => {
    console.log('=========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log('=========================================');
  });
};

startServer();