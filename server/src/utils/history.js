// Saves one line in the ticket_history table (who did what, and when).
// "db" can be the pool or a connection that is inside a transaction.
exports.logHistory = (db, ticketId, userId, action, oldStatus, newStatus, note) =>
  db.query(
    `INSERT INTO ticket_history (ticket_id, changed_by, action, old_status, new_status, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ticketId, userId, action, oldStatus || null, newStatus || null, note || null]
  );
