require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const assetRoutes = require('./routes/assetRoutes');
const contractRoutes = require('./routes/contractRoutes');
const ticketRoutes =require('./routes/ticketRoutes');
const visitRoutes = require('./routes/visitRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');


const { verifyToken, requireRole } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
    res.json({ status: 'ok', total_users: rows[0].total_users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard',dashboardRoutes);
app.use('/api/users', userRoutes);


app.get('/api/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/admin-only', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome, admin!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});