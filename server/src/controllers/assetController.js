const pool = require('../config/db');
 
// Helper: find the client id that belongs to the logged-in customer.
async function getClientIdForUser(userId) {
  const [rows] = await pool.query('SELECT id FROM clients WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].id : null;
}
 
// POST /api/assets   (admin, staff) -> add an asset to a client
exports.createAsset = async (req, res) => {
  const { client_id, asset_type, brand, model, serial_number, location, purchase_date } = req.body;
 
  if (!client_id || !asset_type) {
    return res.status(400).json({ message: 'client_id and asset_type are required' });
  }
 
  try {
    // make sure the client exists
    const [clients] = await pool.query('SELECT id FROM clients WHERE id = ?', [client_id]);
    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
 
    const [result] = await pool.query(
      `INSERT INTO assets (client_id, asset_type, brand, model, serial_number, location, purchase_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client_id, asset_type, brand || null, model || null, serial_number || null,
       location || null, purchase_date || null]
    );
    res.status(201).json({ message: 'Asset created', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An asset with this serial number already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/assets   -> admin/staff: all assets (optional ?client_id=1)
//                      customer: only their own assets
exports.getAssets = async (req, res) => {
  try {
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.json([]);
 
      const [rows] = await pool.query(
        'SELECT * FROM assets WHERE client_id = ? ORDER BY created_at DESC',
        [clientId]
      );
      return res.json(rows);
    }
 
    // admin / staff
    let sql = `SELECT a.*, c.name AS client_name
               FROM assets a JOIN clients c ON c.id = a.client_id`;
    const params = [];
    if (req.query.client_id) {
      sql += ' WHERE a.client_id = ?';
      params.push(req.query.client_id);
    }
    sql += ' ORDER BY a.created_at DESC';
 
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/assets/:id   -> one asset (customers can only open their own)
exports.getAssetById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS client_name
       FROM assets a JOIN clients c ON c.id = a.client_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    const asset = rows[0];
 
    // ownership check: never trust the browser, check on the server
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (asset.client_id !== clientId) {
        return res.status(403).json({ message: 'This asset does not belong to you' });
      }
    }
 
    res.json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/assets/:id   (admin, staff) -> update an asset
exports.updateAsset = async (req, res) => {
  const { asset_type, brand, model, serial_number, location, purchase_date, status } = req.body;
 
  if (!asset_type) {
    return res.status(400).json({ message: 'asset_type is required' });
  }
 
  try {
    const [result] = await pool.query(
      `UPDATE assets
       SET asset_type = ?, brand = ?, model = ?, serial_number = ?,
           location = ?, purchase_date = ?, status = ?
       WHERE id = ?`,
      [asset_type, brand || null, model || null, serial_number || null,
       location || null, purchase_date || null, status || 'active', req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ message: 'Asset updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An asset with this serial number already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 