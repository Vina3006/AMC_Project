const pool = require('../config/db');

// GET /api/services  -> all active services (for the Home page boxes)
exports.getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, price FROM services WHERE is_active = TRUE'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/services/:id  -> one service (for the Service page)
exports.getServiceById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, price FROM services WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};