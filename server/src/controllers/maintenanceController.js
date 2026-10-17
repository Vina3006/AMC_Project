const pool = require('../config/db');
const { runMaintenance, cycleDates, todayString } = require('../services/maintenanceService');
 
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
 
// GET /api/maintenance/schedules   (admin, staff) -> every active contract and its next visit
exports.getSchedules = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ct.id AS contract_id, ct.plan_name, ct.visit_frequency_months AS frequency_months,
              DATE_FORMAT(ct.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(ct.end_date, '%Y-%m-%d') AS end_date,
              c.name AS client_name,
              (SELECT COUNT(*) FROM contract_assets ca WHERE ca.contract_id = ct.id) AS asset_count,
              COALESCE(ms.status, 'active') AS schedule_status,
              DATE_FORMAT(ms.last_cycle_date, '%Y-%m-%d') AS last_cycle_date
       FROM contracts ct
       JOIN clients c ON c.id = ct.client_id
       LEFT JOIN maintenance_schedules ms ON ms.contract_id = ct.id
       WHERE ct.status = 'active' AND ct.end_date >= CURDATE()
       ORDER BY ct.end_date`
    );
 
    const today = todayString();
    const result = rows.map((r) => {
      const { next } = cycleDates(r.start_date, r.frequency_months, r.end_date, today);
      return {
        ...r,
        next_due_date: next,
        days_until_next: next ? Math.round((new Date(next) - new Date(today)) / 86400000) : null,
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/maintenance/runs   (admin, staff) -> the last 10 runs
exports.getRuns = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, run_at, DATE_FORMAT(as_of, '%Y-%m-%d') AS as_of, triggered_by, contracts_due, tickets_created
       FROM maintenance_runs ORDER BY id DESC LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// POST /api/maintenance/run   (admin)   body: { as_of: "2027-01-05", dry_run: true }
exports.runNow = async (req, res) => {
  const { as_of, dry_run } = req.body;
 
  if (as_of && !DATE_PATTERN.test(as_of)) {
    return res.status(400).json({ message: 'as_of must be a date like 2027-01-05' });
  }
 
  try {
    const summary = await runMaintenance({
      asOf: as_of || undefined,
      dryRun: Boolean(dry_run),
      triggeredBy: `user ${req.user.id}`,
    });
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'The scheduler could not run' });
  }
};
 
// PUT /api/maintenance/schedules/:contractId   (admin)   body: { paused: true }
exports.setPaused = async (req, res) => {
  const paused = Boolean(req.body.paused);
 
  try {
    const [contracts] = await pool.query('SELECT id FROM contracts WHERE id = ?', [req.params.contractId]);
    if (contracts.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }
 
    await pool.query(
      `INSERT INTO maintenance_schedules (contract_id, status) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [req.params.contractId, paused ? 'paused' : 'active']
    );
    res.json({ message: paused ? 'Schedule paused' : 'Schedule resumed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
