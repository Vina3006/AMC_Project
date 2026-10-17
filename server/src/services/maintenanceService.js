const pool = require('../config/db');
const { logHistory } = require('../utils/history');
 
// Preventive visits are not urgent, so they get the "low" priority time limit.
const PREVENTIVE_SLA_HOURS = 72;
 
const pad = (n) => String(n).padStart(2, '0');
 
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
 
// "2026-10-31" + 1 month = "2026-11-30" (the day is kept inside the month)
function addMonths(dateString, months) {
  const [year, month, day] = dateString.split('-').map(Number);
  const total = month - 1 + months;
  const newYear = year + Math.floor(total / 12);
  const newMonth = total % 12;
  const lastDay = new Date(newYear, newMonth + 1, 0).getDate();
  return `${newYear}-${pad(newMonth + 1)}-${pad(Math.min(day, lastDay))}`;
}
 
// The visit dates of a contract are: start + 1 period, start + 2 periods, ...
// until the contract ends. Given "today", this finds:
//   latest = the most recent visit date that has already arrived
//   next   = the first visit date still in the future
// (YYYY-MM-DD strings compare correctly as plain text.)
function cycleDates(start, frequencyMonths, end, today) {
  let latest = null;
  let next = null;
  for (let n = 1; n < 600; n++) {
    const due = addMonths(start, n * frequencyMonths);
    if (due > end) break;
    if (due <= today) latest = due;
    else {
      next = due;
      break;
    }
  }
  return { latest, next };
}
 
// The technician with the fewest tickets in hand right now.
async function pickTechnician(conn) {
  const [rows] = await conn.query(
    `SELECT u.id, u.name
     FROM users u
     LEFT JOIN tickets t ON t.assigned_to = u.id AND t.status IN ('assigned','in_progress')
     WHERE u.role = 'technician'
     GROUP BY u.id, u.name
     ORDER BY COUNT(t.id), u.id
     LIMIT 1`
  );
  return rows.length ? rows[0] : null;
}
 
// ------------------------------------------------------------------
// The scheduler. The daily job and the "Run now" button both call this.
//   asOf   = pretend today is this date (used for the demo / simulation)
//   dryRun = only show what WOULD be created, change nothing
// ------------------------------------------------------------------
async function runMaintenance({ asOf, dryRun = false, triggeredBy = 'scheduler' } = {}) {
  const today = asOf || todayString();
  const summary = {
    as_of: today,
    dry_run: dryRun,
    contracts_checked: 0,
    contracts_due: 0,
    tickets_created: 0,
    skipped_existing: 0,
    errors: [],
    items: [],
  };
 
  const conn = await pool.getConnection();
  try {
    // 1. every active contract gets a schedule row (old contracts too)
    if (!dryRun) {
      await conn.query(
        `INSERT INTO maintenance_schedules (contract_id)
         SELECT ct.id FROM contracts ct
         LEFT JOIN maintenance_schedules ms ON ms.contract_id = ct.id
         WHERE ms.id IS NULL AND ct.status = 'active'`
      );
    }
 
    // 2. the contracts to look at
    const [contracts] = await conn.query(
      `SELECT ct.id, ct.plan_name, ct.client_id, ct.visit_frequency_months AS frequency,
              DATE_FORMAT(ct.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(ct.end_date, '%Y-%m-%d') AS end_date,
              c.name AS client_name,
              COALESCE(ms.status, 'active') AS schedule_status,
              DATE_FORMAT(ms.last_cycle_date, '%Y-%m-%d') AS last_cycle_date
       FROM contracts ct
       JOIN clients c ON c.id = ct.client_id
       LEFT JOIN maintenance_schedules ms ON ms.contract_id = ct.id
       WHERE ct.status = 'active'`
    );
 
    for (const contract of contracts) {
      summary.contracts_checked++;
      if (contract.schedule_status === 'paused') continue;
 
      const { latest } = cycleDates(contract.start_date, contract.frequency, contract.end_date, today);
      if (!latest) continue; // no visit date has arrived yet
      if (contract.last_cycle_date && latest <= contract.last_cycle_date) continue; // already handled
 
      summary.contracts_due++;
 
      const [assets] = await conn.query(
        `SELECT a.id, a.asset_type, a.brand, a.model, a.serial_number
         FROM contract_assets ca
         JOIN assets a ON a.id = ca.asset_id
         WHERE ca.contract_id = ? AND a.status <> 'retired'`,
        [contract.id]
      );
 
      // preview only: list what would happen
      if (dryRun) {
        for (const asset of assets) {
          summary.items.push({
            ticket_number: null,
            client_name: contract.client_name,
            asset_label: `${asset.asset_type} ${asset.brand || ''} ${asset.model || ''} (${asset.serial_number})`.replace(/\s+/g, ' '),
            scheduled_for: latest,
            technician_name: null,
          });
        }
        continue;
      }
 
      // real run: create the tickets for this contract, all or nothing
      try {
        await conn.beginTransaction();
 
        for (const asset of assets) {
          try {
            const [result] = await conn.query(
              `INSERT INTO tickets
                 (client_id, asset_id, contract_id, raised_by, title, description, priority, status,
                  due_at, ticket_type, scheduled_for)
               VALUES (?, ?, ?, NULL, ?, ?, 'low', 'open',
                       DATE_ADD(NOW(), INTERVAL ? HOUR), 'preventive', ?)`,
              [
                contract.client_id, asset.id, contract.id,
                `Preventive maintenance: ${asset.asset_type}`,
                `Scheduled ${contract.frequency}-monthly check under "${contract.plan_name}" (due ${latest}). ` +
                  'Clean, update and inspect the asset. Created automatically by the preventive-maintenance scheduler.',
                PREVENTIVE_SLA_HOURS, latest,
              ]
            );
            const ticketId = result.insertId;
 
            await logHistory(conn, ticketId, null, 'created', null, 'open', 'Created by the preventive-maintenance scheduler');
 
            // give it to the technician with the lightest workload
            const technician = await pickTechnician(conn);
            if (technician) {
              await conn.query(
                "UPDATE tickets SET assigned_to = ?, status = 'assigned' WHERE id = ?",
                [technician.id, ticketId]
              );
              await logHistory(conn, ticketId, null, 'assigned', 'open', 'assigned', `Auto-assigned to ${technician.name}`);
            }
 
            summary.tickets_created++;
            summary.items.push({
              ticket_id: ticketId,
              ticket_number: `TKT-${ticketId}`,
              client_name: contract.client_name,
              asset_label: `${asset.asset_type} ${asset.brand || ''} ${asset.model || ''} (${asset.serial_number})`.replace(/\s+/g, ' '),
              scheduled_for: latest,
              technician_name: technician ? technician.name : null,
            });
          } catch (err) {
            // the unique key on (asset, visit date) stops the same visit being created twice
            if (err.code === 'ER_DUP_ENTRY') summary.skipped_existing++;
            else throw err;
          }
        }
 
        await conn.query(
          'UPDATE maintenance_schedules SET last_cycle_date = ?, last_run_at = NOW() WHERE contract_id = ?',
          [latest, contract.id]
        );
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        console.error('Maintenance scheduler error for contract', contract.id, err);
        summary.errors.push(`Contract ${contract.id} (${contract.plan_name}): ${err.message}`);
      }
    }
 
    // 3. write the run into the log
    if (!dryRun) {
      await conn.query(
        'INSERT INTO maintenance_runs (as_of, triggered_by, contracts_due, tickets_created) VALUES (?, ?, ?, ?)',
        [today, triggeredBy, summary.contracts_due, summary.tickets_created]
      );
    }
 
    return summary;
  } finally {
    conn.release();
  }
}
 
// Starts the daily job (default: every day at 6:00 AM server time).
function startScheduler() {
  let cron;
  try {
    cron = require('node-cron');
  } catch {
    console.warn('node-cron is not installed, so the daily maintenance job is off. Run: npm install node-cron');
    return;
  }
 
  const expression = process.env.MAINTENANCE_CRON || '0 6 * * *';
  cron.schedule(expression, async () => {
    try {
      const result = await runMaintenance({ triggeredBy: 'scheduler' });
      console.log(`[maintenance] ${result.tickets_created} preventive tickets created for ${result.contracts_due} contracts`);
    } catch (err) {
      console.error('[maintenance] daily run failed', err);
    }
  });
  console.log(`Preventive-maintenance scheduler started (cron: ${expression})`);
}
 
module.exports = { runMaintenance, startScheduler, cycleDates, todayString };
 
