const pool = require('../config/db');
 
// Run a COUNT query and return just the number.
async function count(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return Number(rows[0].n);
}
 
const OPEN = "('open','assigned','in_progress')";
 
// GET /api/dashboard  -> the numbers for the logged-in user's role
exports.getDashboard = async (req, res) => {
  try {
    const role = req.user.role;
 
    // ---------- admin / staff ----------
    if (role === 'admin' || role === 'staff') {
      const [
        clients, assets, activeContracts, openTickets, unassigned,
        overdue, resolvedThisMonth, visitsToday,
      ] = await Promise.all([
        count('SELECT COUNT(*) AS n FROM clients'),
        count('SELECT COUNT(*) AS n FROM assets'),
        count("SELECT COUNT(*) AS n FROM contracts WHERE status = 'active' AND end_date >= CURDATE()"),
        count(`SELECT COUNT(*) AS n FROM tickets WHERE status IN ${OPEN}`),
        count("SELECT COUNT(*) AS n FROM tickets WHERE status = 'open'"),
        count(`SELECT COUNT(*) AS n FROM tickets WHERE status IN ${OPEN} AND due_at < NOW()`),
        count(`SELECT COUNT(*) AS n FROM tickets
               WHERE status IN ('resolved','closed')
                 AND resolved_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`),
        count("SELECT COUNT(*) AS n FROM visits WHERE status = 'scheduled' AND DATE(scheduled_at) = CURDATE()"),
      ]);
 
      const [[revenue]] = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'paid'"
      );
      const [byStatus] = await pool.query('SELECT status, COUNT(*) AS n FROM tickets GROUP BY status');
 
      return res.json({
        role,
        clients,
        assets,
        active_contracts: activeContracts,
        open_tickets: openTickets,
        unassigned_tickets: unassigned,
        overdue_tickets: overdue,
        resolved_this_month: resolvedThisMonth,
        visits_today: visitsToday,
        total_revenue: Number(revenue.total),
        tickets_by_status: byStatus,
      });
    }
 
    // ---------- technician ----------
    if (role === 'technician') {
      const me = [req.user.id];
      const [assigned, inProgress, overdue, resolved, upcomingVisits] = await Promise.all([
        count("SELECT COUNT(*) AS n FROM tickets WHERE assigned_to = ? AND status = 'assigned'", me),
        count("SELECT COUNT(*) AS n FROM tickets WHERE assigned_to = ? AND status = 'in_progress'", me),
        count(`SELECT COUNT(*) AS n FROM tickets WHERE assigned_to = ? AND status IN ${OPEN} AND due_at < NOW()`, me),
        count("SELECT COUNT(*) AS n FROM tickets WHERE assigned_to = ? AND status IN ('resolved','closed')", me),
        count("SELECT COUNT(*) AS n FROM visits WHERE technician_id = ? AND status = 'scheduled'", me),
      ]);
      return res.json({
        role,
        assigned_tickets: assigned,
        in_progress_tickets: inProgress,
        overdue_tickets: overdue,
        resolved_tickets: resolved,
        upcoming_visits: upcomingVisits,
      });
    }
 
    // ---------- customer ----------
    const [clients] = await pool.query('SELECT id FROM clients WHERE user_id = ?', [req.user.id]);
    if (clients.length === 0) {
      return res.json({
        role, linked: false, my_assets: 0, active_contracts: 0,
        open_tickets: 0, resolved_tickets: 0, total_paid: 0,
      });
    }
    const clientId = [clients[0].id];
    const [assets, contracts, openTickets, resolvedTickets] = await Promise.all([
      count('SELECT COUNT(*) AS n FROM assets WHERE client_id = ?', clientId),
      count("SELECT COUNT(*) AS n FROM contracts WHERE client_id = ? AND status = 'active' AND end_date >= CURDATE()", clientId),
      count(`SELECT COUNT(*) AS n FROM tickets WHERE client_id = ? AND status IN ${OPEN}`, clientId),
      count("SELECT COUNT(*) AS n FROM tickets WHERE client_id = ? AND status IN ('resolved','closed')", clientId),
    ]);
    const [[paid]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE user_id = ? AND status = 'paid'",
      [req.user.id]
    );
    res.json({
      role,
      linked: true,
      my_assets: assets,
      active_contracts: contracts,
      open_tickets: openTickets,
      resolved_tickets: resolvedTickets,
      total_paid: Number(paid.total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
