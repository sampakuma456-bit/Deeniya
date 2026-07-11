require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
  .then(() => console.log('✅ MongoDB connection established successfully'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));

// Basic Route
app.get('/', (req, res) => {
  res.send('Deeniya Backend API is running');
});

// Master Routes
const masterRoutes = require('./routes/masterRoutes');
app.use('/api/master', masterRoutes);

// Receipt Routes
const receiptRoutes = require('./routes/receiptRoutes');
app.use('/api/receipt', receiptRoutes);

// General Receipt Routes
const generalReceiptRoutes = require('./routes/generalReceiptRoutes');
app.use('/api/general-receipt', generalReceiptRoutes);

// General Payment Routes
const generalPaymentRoutes = require('./routes/generalPaymentRoutes');
app.use('/api/general-payment', generalPaymentRoutes);

// Statement Report Routes
const statementRoutes = require('./routes/statementRoutes');
app.use('/api/statement', statementRoutes);

// Day Book Routes
const daybookRoutes = require('./routes/daybookRoutes');
app.use('/api/daybook', daybookRoutes);

// Inventory Routes
const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

// User Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Student Routes
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/students', studentRoutes);

// Exam Routes
const examRoutes = require('./routes/examRoutes');
app.use('/api/exams', examRoutes);

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
});
