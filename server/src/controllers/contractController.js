const pool = require('../config/db');
 
// Helper: find the client id that belongs to the logged-in customer.
async function getClientIdForUser(userId) {
  const [rows] = await pool.query('SELECT id FROM clients WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].id : null;
}
 
// SQL piece that shows "expired" for contracts whose end date has passed,
// even if nobody has updated the status column yet.
const EFFECTIVE_STATUS = `
  CASE
    WHEN ct.status = 'active' AND ct.end_date < CURDATE() THEN 'expired'
    ELSE ct.status
  END AS effective_status`;
 
// POST /api/contracts   (admin, staff)
// body: { client_id, plan_name, start_date, end_date, amount, visit_frequency_months, asset_ids: [1,2] }
exports.createContract = async (req, res) => {
  const {
    client_id, plan_name, start_date, end_date,
    amount, visit_frequency_months, asset_ids,
  } = req.body;
 
  if (!client_id || !plan_name || !start_date || !end_date || amount === undefined) {
    return res.status(400).json({
      message: 'client_id, plan_name, start_date, end_date and amount are required',
    });
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return res.status(400).json({ message: 'end_date must be after start_date' });
  }
  if (!Array.isArray(asset_ids) || asset_ids.length === 0) {
    return res.status(400).json({ message: 'asset_ids must be a list with at least one asset' });
  }
 
  const conn = await pool.getConnection();
  try {
    // 1. the client must exist
    const [clients] = await conn.query('SELECT id FROM clients WHERE id = ?', [client_id]);
    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
 
    // 2. every asset must belong to THIS client
    const [validAssets] = await conn.query(
      'SELECT id FROM assets WHERE id IN (?) AND client_id = ?',
      [asset_ids, client_id]
    );
    if (validAssets.length !== asset_ids.length) {
      return res.status(400).json({ message: 'One or more assets do not belong to this client' });
    }
 
    // 3. create the contract and link the assets (all or nothing)
    await conn.beginTransaction();
 
    const [result] = await conn.query(
      `INSERT INTO contracts
         (client_id, plan_name, start_date, end_date, amount, visit_frequency_months)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [client_id, plan_name, start_date, end_date, amount, visit_frequency_months || 3]
    );
    const contractId = result.insertId;
 
    const links = asset_ids.map((assetId) => [contractId, assetId]);
    await conn.query('INSERT INTO contract_assets (contract_id, asset_id) VALUES ?', [links]);
 
    await conn.commit();
    res.status(201).json({ message: 'Contract created', id: contractId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
 
// GET /api/contracts   -> admin/staff: all (optional ?client_id=1), customer: only mine
exports.getContracts = async (req, res) => {
  try {
    let sql = `
      SELECT ct.*, c.name AS client_name, ${EFFECTIVE_STATUS},
             (SELECT COUNT(*) FROM contract_assets ca WHERE ca.contract_id = ct.id) AS asset_count
      FROM contracts ct
      JOIN clients c ON c.id = ct.client_id`;
    const params = [];
 
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.json([]);
      sql += ' WHERE ct.client_id = ?';
      params.push(clientId);
    } else if (req.query.client_id) {
      sql += ' WHERE ct.client_id = ?';
      params.push(req.query.client_id);
    }
 
    sql += ' ORDER BY ct.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/contracts/:id   -> one contract with the assets it covers
exports.getContractById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ct.*, c.name AS client_name, ${EFFECTIVE_STATUS}
       FROM contracts ct
       JOIN clients c ON c.id = ct.client_id
       WHERE ct.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    const contract = rows[0];
 
    // ownership check for customers
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (contract.client_id !== clientId) {
        return res.status(403).json({ message: 'This contract does not belong to you' });
      }
    }
 
    const [assets] = await pool.query(
      `SELECT a.id, a.asset_type, a.brand, a.model, a.serial_number, a.location, a.status
       FROM contract_assets ca
       JOIN assets a ON a.id = ca.asset_id
       WHERE ca.contract_id = ?`,
      [req.params.id]
    );
 
    res.json({ ...contract, assets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/contracts/:id   (admin, staff)
// body: { plan_name, end_date, amount, visit_frequency_months, status }
exports.updateContract = async (req, res) => {
  const { plan_name, end_date, amount, visit_frequency_months, status } = req.body;
 
  if (!plan_name || !end_date || amount === undefined) {
    return res.status(400).json({ message: 'plan_name, end_date and amount are required' });
  }
  if (status && !['active', 'expired', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'status must be active, expired or cancelled' });
  }
 
  try {
    const [result] = await pool.query(
      `UPDATE contracts
       SET plan_name = ?, end_date = ?, amount = ?, visit_frequency_months = ?, status = ?
       WHERE id = ?`,
      [plan_name, end_date, amount, visit_frequency_months || 3, status || 'active', req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json({ message: 'Contract updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 