const crypto = require('crypto');
const pool = require('../config/db');

// POST /api/payments/pay   body: { serviceId }
exports.payForService = async (req, res) => {
  const userId = req.user.id; // comes from verifyToken
  const { serviceId } = req.body;

  if (!serviceId) {
    return res.status(400).json({ message: 'serviceId is required' });
  }

  const conn = await pool.getConnection();
  try {
    // price comes from the database, never from the browser
    const [services] = await conn.query(
      'SELECT id, name, price FROM services WHERE id = ? AND is_active = TRUE',
      [serviceId]
    );
    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const service = services[0];

    await conn.beginTransaction();

    // 1. create the invoice (starts unpaid)
    const [invoiceResult] = await conn.query(
      'INSERT INTO invoices (user_id, service_id, amount, status) VALUES (?, ?, ?, ?)',
      [userId, service.id, service.price, 'unpaid']
    );
    const invoiceId = invoiceResult.insertId;

    // 2. mock payment: fake transaction reference
    const transactionRef = 'MOCK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await conn.query(
      'INSERT INTO payments (invoice_id, transaction_ref, method, status) VALUES (?, ?, ?, ?)',
      [invoiceId, transactionRef, 'mock', 'success']
    );

    // 3. mark the invoice as paid
    await conn.query('UPDATE invoices SET status = ? WHERE id = ?', ['paid', invoiceId]);

    await conn.commit();

    res.status(201).json({
      message: 'Payment successful (mock)',
      invoice: {
        id: invoiceId,
        service: service.name,
        amount: service.price,
        status: 'paid',
        transaction_ref: transactionRef,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Payment failed' });
  } finally {
    conn.release(); // always give the connection back to the pool
  }
};

// GET /api/payments/my-invoices   -> invoices of the logged-in user
exports.getMyInvoices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id, s.name AS service, i.amount, i.status, i.created_at,
              p.transaction_ref
       FROM invoices i
       JOIN services s ON s.id = i.service_id
       LEFT JOIN payments p ON p.invoice_id = i.id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};