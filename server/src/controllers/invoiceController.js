const crypto = require('crypto');
const pool = require('../config/db');
 
async function getClientIdForUser(userId) {
  const [rows] = await pool.query('SELECT id FROM clients WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].id : null;
}
 
// One SELECT used by the list and the detail endpoints.
const INVOICE_SELECT = `
  SELECT i.id, CONCAT('INV-', i.id) AS invoice_number, i.invoice_type, i.amount, i.status,
         i.due_date, i.paid_at, i.created_at, i.client_id, i.user_id, i.contract_id, i.ticket_id,
         COALESCE(i.description, s.name) AS description,
         COALESCE(c.name, u.name) AS client_name,
         ct.plan_name,
         IF(i.ticket_id IS NULL, NULL, CONCAT('TKT-', i.ticket_id)) AS ticket_number,
         (i.status = 'unpaid' AND i.due_date IS NOT NULL AND i.due_date < CURDATE()) AS is_overdue,
         p.transaction_ref, p.method
  FROM invoices i
  LEFT JOIN clients c ON c.id = i.client_id
  LEFT JOIN users u ON u.id = i.user_id
  LEFT JOIN services s ON s.id = i.service_id
  LEFT JOIN contracts ct ON ct.id = i.contract_id
  LEFT JOIN payments p ON p.invoice_id = i.id`;
 
function fixOverdue(row) {
  return { ...row, is_overdue: Boolean(row.is_overdue) };
}
 
// Does this invoice belong to the logged-in customer?
async function customerOwns(user, invoice) {
  const clientId = await getClientIdForUser(user.id);
  return (clientId !== null && invoice.client_id === clientId) || invoice.user_id === user.id;
}
 
// POST /api/invoices   (admin, staff)
// body: { client_id, contract_id OR ticket_id, amount, description, due_date }
exports.createInvoice = async (req, res) => {
  const { client_id, contract_id, ticket_id, description, amount, due_date } = req.body;
 
  if (!client_id || !(Number(amount) > 0)) {
    return res.status(400).json({ message: 'client_id and an amount above 0 are required' });
  }
  if (!contract_id && !ticket_id) {
    return res.status(400).json({ message: 'Choose a contract or a ticket for this invoice' });
  }
  if (contract_id && ticket_id) {
    return res.status(400).json({ message: 'Choose either a contract or a ticket, not both' });
  }
  if (due_date && isNaN(new Date(due_date).getTime())) {
    return res.status(400).json({ message: 'due_date is not a valid date' });
  }
 
  try {
    const [clients] = await pool.query('SELECT id, user_id FROM clients WHERE id = ?', [client_id]);
    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
 
    let type;
    let autoText;
 
    if (ticket_id) {
      const [tickets] = await pool.query('SELECT id, client_id, status FROM tickets WHERE id = ?', [ticket_id]);
      if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });
      if (tickets[0].client_id !== Number(client_id)) {
        return res.status(400).json({ message: 'This ticket does not belong to this client' });
      }
      if (!['resolved', 'closed'].includes(tickets[0].status)) {
        return res.status(400).json({ message: 'An invoice can only be raised after the ticket is resolved' });
      }
      const [existing] = await pool.query('SELECT id FROM invoices WHERE ticket_id = ?', [ticket_id]);
      if (existing.length > 0) {
        return res.status(409).json({ message: 'An invoice already exists for this ticket' });
      }
      type = 'ticket';
      autoText = `Service charge for TKT-${ticket_id}`;
    } else {
      const [contracts] = await pool.query('SELECT id, client_id, plan_name FROM contracts WHERE id = ?', [contract_id]);
      if (contracts.length === 0) return res.status(404).json({ message: 'Contract not found' });
      if (contracts[0].client_id !== Number(client_id)) {
        return res.status(400).json({ message: 'This contract does not belong to this client' });
      }
      type = 'contract';
      autoText = `AMC fee: ${contracts[0].plan_name}`;
    }
 
    // if no due date was given, allow 15 days to pay
    const due = due_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
 
    const [result] = await pool.query(
      `INSERT INTO invoices
         (user_id, client_id, contract_id, ticket_id, invoice_type, description, amount, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
      [clients[0].user_id, client_id, contract_id || null, ticket_id || null,
       type, (description && description.trim()) || autoText, Number(amount), due]
    );
 
    res.status(201).json({ message: 'Invoice created', id: result.insertId, invoice_number: `INV-${result.insertId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/invoices   (optional ?status= &client_id= &type=)
// customer: only their own | admin/staff: all
exports.getInvoices = async (req, res) => {
  try {
    const conditions = [];
    const params = [];
 
    if (req.user.role === 'customer') {
      const clientId = await getClientIdForUser(req.user.id);
      conditions.push('(i.client_id = ? OR i.user_id = ?)');
      params.push(clientId || -1, req.user.id);
    } else if (req.query.client_id) {
      conditions.push('i.client_id = ?');
      params.push(req.query.client_id);
    }
 
    if (req.query.status) { conditions.push('i.status = ?'); params.push(req.query.status); }
    if (req.query.type)   { conditions.push('i.invoice_type = ?'); params.push(req.query.type); }
 
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await pool.query(`${INVOICE_SELECT}${where} ORDER BY i.created_at DESC, i.id DESC`, params);
    res.json(rows.map(fixOverdue));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/invoices/:id   -> one invoice (also used as the receipt)
exports.getInvoiceById = async (req, res) => {
  try {
    const [rows] = await pool.query(`${INVOICE_SELECT} WHERE i.id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const invoice = rows[0];
 
    if (req.user.role === 'customer' && !(await customerOwns(req.user, invoice))) {
      return res.status(403).json({ message: 'This invoice does not belong to you' });
    }
    res.json(fixOverdue(invoice));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// POST /api/invoices/:id/pay   (customer)  -> simulated payment of an unpaid invoice
exports.payInvoice = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
 
    // FOR UPDATE locks the row, so two clicks cannot pay the same invoice twice
    const [rows] = await conn.query(
      'SELECT id, client_id, user_id, status FROM invoices WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const invoice = rows[0];
 
    if (!(await customerOwns(req.user, invoice))) {
      await conn.rollback();
      return res.status(403).json({ message: 'This invoice does not belong to you' });
    }
    if (invoice.status !== 'unpaid') {
      await conn.rollback();
      return res.status(400).json({ message: 'This invoice is already paid' });
    }
 
    const transactionRef = 'MOCK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await conn.query(
      'INSERT INTO payments (invoice_id, transaction_ref, method, status) VALUES (?, ?, ?, ?)',
      [invoice.id, transactionRef, 'mock', 'success']
    );
    await conn.query("UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?", [invoice.id]);
 
    await conn.commit();
    res.json({ message: 'Payment successful (simulated)', transaction_ref: transactionRef });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Payment failed' });
  } finally {
    conn.release();
  }
};
 
