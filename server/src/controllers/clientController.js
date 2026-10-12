const pool = require('../config/db');
 
// POST /api/clients   (admin, staff) -> create a client
exports.createClient = async (req, res) => {
  const { name, contact_person, phone, email, address, user_id } = req.body;
 
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
 
  try {
    const [result] = await pool.query(
      `INSERT INTO clients (user_id, name, contact_person, phone, email, address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id || null, name, contact_person || null, phone || null, email || null, address || null]
    );
    res.status(201).json({ message: 'Client created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/clients   (admin, staff) -> list all clients
exports.getClients = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM assets a WHERE a.client_id = c.id) AS asset_count
       FROM clients c
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/clients/me   (customer) -> the client record linked to my login
exports.getMyClient = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No client profile is linked to your account' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/clients/:id   (admin, staff) -> one client
exports.getClientById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/clients/:id   (admin, staff) -> update a client
exports.updateClient = async (req, res) => {
  const { name, contact_person, phone, email, address, user_id } = req.body;
 
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
 
  try {
    const [result] = await pool.query(
      `UPDATE clients
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, user_id = ?
       WHERE id = ?`,
      [name, contact_person || null, phone || null, email || null, address || null,
       user_id || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 