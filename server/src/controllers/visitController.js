const pool = require('../config/db');
const { logHistory } = require('../utils/history');
 
async function getClientIdForUser(userId) {
  const [rows] = await pool.query('SELECT id FROM clients WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].id : null;
}
 
// POST /api/visits   (admin, staff, technician)
// body: { ticket_id, scheduled_at: "2026-10-15 11:00:00" }
exports.scheduleVisit = async (req, res) => {
  const { ticket_id, scheduled_at } = req.body;
 
  if (!ticket_id || !scheduled_at) {
    return res.status(400).json({ message: 'ticket_id and scheduled_at are required' });
  }
  if (isNaN(new Date(scheduled_at).getTime())) {
    return res.status(400).json({ message: 'scheduled_at must be a valid date and time' });
  }
 
  try {
    const [tickets] = await pool.query('SELECT id, status, assigned_to FROM tickets WHERE id = ?', [ticket_id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const ticket = tickets[0];
 
    if (!ticket.assigned_to) {
      return res.status(400).json({ message: 'Assign a technician to this ticket first' });
    }
    if (['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ message: 'Cannot schedule a visit for a resolved or closed ticket' });
    }
    if (req.user.role === 'technician' && ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'This ticket is not assigned to you' });
    }
 
    const [result] = await pool.query(
      'INSERT INTO visits (ticket_id, technician_id, scheduled_at) VALUES (?, ?, ?)',
      [ticket_id, ticket.assigned_to, scheduled_at]
    );
    await logHistory(pool, ticket_id, req.user.id, 'visit_scheduled', null, null, `Visit on ${scheduled_at}`);
 
    res.status(201).json({ message: 'Visit scheduled', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/visits/:id/complete   (admin, staff, technician)
// body: { work_done, notes, mark_resolved: true/false }
exports.completeVisit = async (req, res) => {
  const { work_done, notes, mark_resolved } = req.body;
 
  if (!work_done) {
    return res.status(400).json({ message: 'work_done is required' });
  }
 
  const conn = await pool.getConnection();
  try {
    const [visits] = await conn.query('SELECT * FROM visits WHERE id = ?', [req.params.id]);
    if (visits.length === 0) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    const visit = visits[0];
 
    if (visit.status !== 'scheduled') {
      return res.status(400).json({ message: `This visit is already ${visit.status}` });
    }
    if (req.user.role === 'technician' && visit.technician_id !== req.user.id) {
      return res.status(403).json({ message: 'This visit is not assigned to you' });
    }
 
    const [tickets] = await conn.query('SELECT id, status FROM tickets WHERE id = ?', [visit.ticket_id]);
    const ticket = tickets[0];
 
    // the visit and the ticket change together, or not at all
    await conn.beginTransaction();
 
    await conn.query(
      `UPDATE visits SET status = 'completed', completed_at = NOW(), work_done = ?, notes = ?
       WHERE id = ?`,
      [work_done, notes || null, visit.id]
    );
    await logHistory(conn, ticket.id, req.user.id, 'visit_completed', null, null, work_done.slice(0, 200));
 
    if (mark_resolved && !['resolved', 'closed'].includes(ticket.status)) {
      await conn.query("UPDATE tickets SET status = 'resolved', resolved_at = NOW() WHERE id = ?", [ticket.id]);
      await logHistory(conn, ticket.id, req.user.id, 'status_changed', ticket.status, 'resolved', 'Resolved after visit');
    } else if (ticket.status === 'assigned') {
      await conn.query("UPDATE tickets SET status = 'in_progress' WHERE id = ?", [ticket.id]);
      await logHistory(conn, ticket.id, req.user.id, 'status_changed', 'assigned', 'in_progress', 'Visit completed');
    }
 
    await conn.commit();
    res.json({ message: 'Visit completed' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
 
// GET /api/visits   (optional ?ticket_id= &asset_id= &status=)
// customer: visits on my tickets | technician: my visits | admin/staff: all
exports.getVisits = async (req, res) => {
  try {
    const conditions = [];
    const params = [];
 
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.json([]);
      conditions.push('t.client_id = ?');
      params.push(clientId);
    } else if (req.user.role === 'technician') {
      conditions.push('v.technician_id = ?');
      params.push(req.user.id);
    }
 
    if (req.query.ticket_id) { conditions.push('v.ticket_id = ?'); params.push(req.query.ticket_id); }
    if (req.query.asset_id)  { conditions.push('t.asset_id = ?');  params.push(req.query.asset_id); }
    if (req.query.status)    { conditions.push('v.status = ?');    params.push(req.query.status); }
 
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await pool.query(
      `SELECT v.*, CONCAT('TKT-', t.id) AS ticket_number, t.title AS ticket_title,
              t.asset_id, a.asset_type, a.serial_number, u.name AS technician_name
       FROM visits v
       JOIN tickets t ON t.id = v.ticket_id
       JOIN assets a ON a.id = t.asset_id
       JOIN users u ON u.id = v.technician_id
       ${where}
       ORDER BY v.scheduled_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 