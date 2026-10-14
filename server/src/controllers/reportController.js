const pool = require('../config/db');
 
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
 
function today() {
  return new Date().toISOString().slice(0, 10);
}
 
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
 
// MySQL returns SUM() and AVG() as text, so turn them into numbers.
const num = (value) => Number(value) || 0;
 
// GET /api/reports?from=2026-10-01&to=2026-10-31   (admin, staff)
// Every number is calculated from the same tables the application uses.
exports.getReport = async (req, res) => {
  const from = req.query.from || daysAgo(30);
  const to = req.query.to || today();
 
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return res.status(400).json({ message: 'from and to must be dates like 2026-10-31' });
  }
  if (from > to) {
    return res.status(400).json({ message: 'from must not be after to' });
  }
 
  // "created between from and to (the whole last day included)"
  const inRange = 'created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)';
  const range = [from, to];
  const DONE = "status IN ('resolved','closed')";
  const OPEN = "status IN ('open','assigned','in_progress')";
 
  try {
    // ---------- tickets ----------
    const [[t]] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(${DONE}) AS resolved,
              SUM(${DONE} AND resolved_at IS NOT NULL) AS sla_measured,
              SUM(${DONE} AND resolved_at IS NOT NULL AND resolved_at <= due_at) AS within_sla,
              AVG(CASE WHEN ${DONE} AND resolved_at IS NOT NULL
                       THEN TIMESTAMPDIFF(MINUTE, created_at, resolved_at) END) AS avg_minutes,
              SUM(${OPEN} AND due_at < NOW()) AS overdue_now
       FROM tickets WHERE ${inRange}`,
      range
    );
 
    const [byPriority] = await pool.query(
      `SELECT priority, COUNT(*) AS total, SUM(${DONE}) AS resolved,
              SUM(${DONE} AND resolved_at IS NOT NULL AND resolved_at > due_at) AS breached
       FROM tickets WHERE ${inRange}
       GROUP BY priority
       ORDER BY FIELD(priority, 'high', 'medium', 'low')`,
      range
    );
 
    const [byTechnician] = await pool.query(
      `SELECT u.id, u.name, COUNT(*) AS assigned,
              SUM(t.status IN ('resolved','closed')) AS resolved,
              AVG(CASE WHEN t.status IN ('resolved','closed') AND t.resolved_at IS NOT NULL
                       THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.resolved_at) END) AS avg_minutes,
              SUM(t.status IN ('open','assigned','in_progress') AND t.due_at < NOW()) AS overdue
       FROM tickets t
       JOIN users u ON u.id = t.assigned_to
       WHERE t.created_at >= ? AND t.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY u.id, u.name
       ORDER BY resolved DESC, assigned DESC`,
      range
    );
 
    const [topAssets] = await pool.query(
      `SELECT a.id, a.asset_type, a.brand, a.model, a.serial_number, c.name AS client_name,
              COUNT(*) AS ticket_count
       FROM tickets t
       JOIN assets a ON a.id = t.asset_id
       JOIN clients c ON c.id = a.client_id
       WHERE t.created_at >= ? AND t.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY a.id, a.asset_type, a.brand, a.model, a.serial_number, c.name
       ORDER BY ticket_count DESC, a.id
       LIMIT 5`,
      range
    );
 
    // ---------- invoices ----------
    const [[inv]] = await pool.query(
      `SELECT COUNT(*) AS invoice_count,
              COALESCE(SUM(amount), 0) AS billed,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) AS collected,
              COALESCE(SUM(CASE WHEN status = 'unpaid' THEN amount END), 0) AS outstanding,
              COALESCE(SUM(CASE WHEN status = 'unpaid' AND due_date < CURDATE() THEN amount END), 0) AS overdue_amount
       FROM invoices WHERE ${inRange}`,
      range
    );
 
    const [byMonth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COALESCE(SUM(amount), 0) AS billed,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) AS collected
       FROM invoices WHERE ${inRange}
       GROUP BY month ORDER BY month`,
      range
    );
 
    const [byType] = await pool.query(
      `SELECT invoice_type, COUNT(*) AS invoices,
              COALESCE(SUM(amount), 0) AS billed,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) AS collected
       FROM invoices WHERE ${inRange}
       GROUP BY invoice_type ORDER BY billed DESC`,
      range
    );
 
    // ---------- contracts (a snapshot of today, not limited by the dates) ----------
    const [[ct]] = await pool.query(
      `SELECT SUM(status = 'active' AND end_date >= CURDATE()) AS active,
              SUM(status = 'expired' OR (status = 'active' AND end_date < CURDATE())) AS expired,
              SUM(status = 'cancelled') AS cancelled
       FROM contracts`
    );
 
    const [expiring] = await pool.query(
      `SELECT ct.id, c.name AS client_name, ct.plan_name, ct.end_date, ct.amount,
              DATEDIFF(ct.end_date, CURDATE()) AS days_left
       FROM contracts ct
       JOIN clients c ON c.id = ct.client_id
       WHERE ct.status = 'active'
         AND ct.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY ct.end_date`
    );
 
    const slaMeasured = num(t.sla_measured);
    const withinSla = num(t.within_sla);
 
    res.json({
      range: { from, to },
      tickets: {
        total: num(t.total),
        resolved: num(t.resolved),
        sla_measured: slaMeasured,
        within_sla: withinSla,
        sla_percent: slaMeasured ? Math.round((withinSla / slaMeasured) * 100) : null,
        avg_minutes: t.avg_minutes === null ? null : Math.round(num(t.avg_minutes)),
        overdue_now: num(t.overdue_now),
      },
      by_priority: byPriority.map((r) => ({
        priority: r.priority, total: num(r.total), resolved: num(r.resolved), breached: num(r.breached),
      })),
      by_technician: byTechnician.map((r) => ({
        id: r.id, name: r.name, assigned: num(r.assigned), resolved: num(r.resolved),
        avg_minutes: r.avg_minutes === null ? null : Math.round(num(r.avg_minutes)),
        overdue: num(r.overdue),
      })),
      top_assets: topAssets,
      invoices: {
        count: num(inv.invoice_count),
        billed: num(inv.billed),
        collected: num(inv.collected),
        outstanding: num(inv.outstanding),
        overdue_amount: num(inv.overdue_amount),
      },
      revenue_by_month: byMonth.map((r) => ({
        month: r.month, billed: num(r.billed), collected: num(r.collected),
      })),
      by_invoice_type: byType.map((r) => ({
        invoice_type: r.invoice_type, invoices: num(r.invoices),
        billed: num(r.billed), collected: num(r.collected),
      })),
      contracts: {
        active: num(ct.active),
        expired: num(ct.expired),
        cancelled: num(ct.cancelled),
        expiring_soon: expiring,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not build the report' });
  }
};
