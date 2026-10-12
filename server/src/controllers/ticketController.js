const pool = require('../config/db');
 
// ---- SLA settings: hours allowed to resolve a ticket, by priority ----
// Change these numbers in ONE place if your SRS says something different.
const SLA_HOURS = { high: 4, medium: 24, low: 72 };
 
const STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
 
// Helper: find the client id that belongs to the logged-in customer.
async function getClientIdForUser(userId) {
  const [rows] = await pool.query('SELECT id FROM clients WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].id : null;
}
 
// The SELECT used by the list and detail endpoints.
// is_overdue = still unfinished AND the due time has passed.
const TICKET_SELECT = `
  SELECT t.*, CONCAT('TKT-', t.id) AS ticket_number,
         c.name AS client_name,
         a.asset_type, a.brand, a.model, a.serial_number,
         u.name AS technician_name,
         (t.status IN ('open','assigned','in_progress') AND t.due_at < NOW()) AS is_overdue
  FROM tickets t
  JOIN clients c ON c.id = t.client_id
  JOIN assets a ON a.id = t.asset_id
  LEFT JOIN users u ON u.id = t.assigned_to`;
 
function fixOverdue(row) {
  return { ...row, is_overdue: Boolean(row.is_overdue) };
}
 
// POST /api/tickets   (customer, admin, staff)
// body: { asset_id, title, description, priority }
exports.createTicket = async (req, res) => {
  const { asset_id, title, description, priority } = req.body;
  const ticketPriority = priority || 'medium';
 
  if (!asset_id || !title) {
    return res.status(400).json({ message: 'asset_id and title are required' });
  }
  if (!SLA_HOURS[ticketPriority]) {
    return res.status(400).json({ message: 'priority must be high, medium or low' });
  }
 
  try {
    // 1. the asset must exist
    const [assets] = await pool.query('SELECT id, client_id FROM assets WHERE id = ?', [asset_id]);
    if (assets.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    const asset = assets[0];
 
    // 2. a customer can only raise tickets for their own assets
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (asset.client_id !== clientId) {
        return res.status(403).json({ message: 'This asset does not belong to you' });
      }
    }
 
    // 3. the asset must be covered by an ACTIVE contract (today inside start..end dates)
    const [contracts] = await pool.query(
      `SELECT ct.id
       FROM contract_assets ca
       JOIN contracts ct ON ct.id = ca.contract_id
       WHERE ca.asset_id = ? AND ct.status = 'active'
         AND CURDATE() BETWEEN ct.start_date AND ct.end_date
       LIMIT 1`,
      [asset_id]
    );
    if (contracts.length === 0) {
      return res.status(400).json({ message: 'This asset is not covered by an active AMC contract' });
    }
 
    // 4. create the ticket; the due time (SLA) is set by the database clock
    const slaHours = SLA_HOURS[ticketPriority];
    const [result] = await pool.query(
      `INSERT INTO tickets
         (client_id, asset_id, contract_id, raised_by, title, description, priority, status, due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [asset.client_id, asset_id, contracts[0].id, req.user.id,
       title, description || null, ticketPriority, slaHours]
    );
 
    res.status(201).json({
      message: 'Ticket created',
      id: result.insertId,
      ticket_number: `TKT-${result.insertId}`,
      sla_hours: slaHours,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/tickets   (optional ?status=open)
// customer: own tickets | technician: assigned to me | admin/staff: all
exports.getTickets = async (req, res) => {
  try {
    const conditions = [];
    const params = [];
 
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.json([]);
      conditions.push('t.client_id = ?');
      params.push(clientId);
    } else if (req.user.role === 'technician') {
      conditions.push('t.assigned_to = ?');
      params.push(req.user.id);
    }
 
    if (req.query.status) {
      conditions.push('t.status = ?');
      params.push(req.query.status);
    }
 
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await pool.query(`${TICKET_SELECT}${where} ORDER BY t.created_at DESC`, params);
    res.json(rows.map(fixOverdue));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const [rows] = await pool.query(`${TICKET_SELECT} WHERE t.id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const ticket = rows[0];
 
    // ownership checks
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (ticket.client_id !== clientId) {
        return res.status(403).json({ message: 'This ticket does not belong to you' });
      }
    }
    if (req.user.role === 'technician' && ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'This ticket is not assigned to you' });
    }
 
    res.json(fixOverdue(ticket));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/tickets/:id/assign   (admin, staff)   body: { technician_id }
exports.assignTicket = async (req, res) => {
  const { technician_id } = req.body;
  if (!technician_id) {
    return res.status(400).json({ message: 'technician_id is required' });
  }
 
  try {
    const [tickets] = await pool.query('SELECT id, status FROM tickets WHERE id = ?', [req.params.id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (['resolved', 'closed'].includes(tickets[0].status)) {
      return res.status(400).json({ message: 'A resolved or closed ticket cannot be assigned' });
    }
 
    // the chosen user must really be a technician
    const [techs] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'technician'",
      [technician_id]
    );
    if (techs.length === 0) {
      return res.status(400).json({ message: 'That user is not a technician' });
    }
 
    await pool.query(
      "UPDATE tickets SET assigned_to = ?, status = 'assigned' WHERE id = ?",
      [technician_id, req.params.id]
    );
    res.json({ message: 'Ticket assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/tickets/:id/status   body: { status }
// admin/staff: any status | technician: in_progress or resolved on own tickets
// customer: close their own resolved ticket
exports.updateTicketStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
  }
 
  try {
    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const ticket = tickets[0];
    const role = req.user.role;
 
    if (role === 'technician') {
      if (ticket.assigned_to !== req.user.id) {
        return res.status(403).json({ message: 'This ticket is not assigned to you' });
      }
      if (!['in_progress', 'resolved'].includes(status)) {
        return res.status(403).json({ message: 'Technicians can only set in_progress or resolved' });
      }
    }
 
    if (role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (ticket.client_id !== clientId) {
        return res.status(403).json({ message: 'This ticket does not belong to you' });
      }
      if (status !== 'closed' || ticket.status !== 'resolved') {
        return res.status(403).json({ message: 'You can only close a ticket that is resolved' });
      }
    }
 
    await pool.query(
      `UPDATE tickets
       SET status = ?,
           resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [status, status, req.params.id]
    );
    res.json({ message: `Ticket marked as ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/tickets/asset/:assetId   -> full ticket history of one asset
exports.getAssetHistory = async (req, res) => {
  try {
    const [assets] = await pool.query('SELECT id, client_id FROM assets WHERE id = ?', [req.params.assetId]);
    if (assets.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }
 
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (assets[0].client_id !== clientId) {
        return res.status(403).json({ message: 'This asset does not belong to you' });
      }
    }
 
    const [rows] = await pool.query(
      `${TICKET_SELECT} WHERE t.asset_id = ? ORDER BY t.created_at DESC`,
      [req.params.assetId]
    );
    res.json(rows.map(fixOverdue));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/tickets/technicians   (admin, staff) -> technicians with their workload
exports.getTechnicians = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email,
              (SELECT COUNT(*) FROM tickets t
               WHERE t.assigned_to = u.id AND t.status IN ('assigned','in_progress')) AS open_tickets
       FROM users u
       WHERE u.role = 'technician'
       ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 