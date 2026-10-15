const pool = require('../config/db');
 
const SUBJECTS = ['General question', 'Request a quote', 'Support request', 'Other'];
const STATUSES = ['new', 'read', 'replied'];
 
// A very small spam guard: at most 5 messages per hour from one address.
// (It lives in memory, so it resets when the server restarts. That is fine for this project.)
const attempts = new Map();
function tooManyMessages(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 5) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}
 
// POST /api/contact   (public) -> a visitor sends a message from the Contact page
exports.createMessage = async (req, res) => {
  const { name, email, phone, subject, message, website } = req.body;
 
  // "website" is a hidden field only robots fill in. Pretend it worked and save nothing.
  if (website) {
    return res.status(201).json({ message: 'Message sent' });
  }
 
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanMessage = String(message || '').trim();
 
  if (cleanName.length < 2 || cleanName.length > 100) {
    return res.status(400).json({ message: 'Please enter your name' });
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 150) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }
  if (!SUBJECTS.includes(subject)) {
    return res.status(400).json({ message: 'Please choose a subject' });
  }
  if (cleanMessage.length < 10 || cleanMessage.length > 1000) {
    return res.status(400).json({ message: 'Your message must be between 10 and 1000 characters' });
  }
  if (tooManyMessages(req.ip)) {
    return res.status(429).json({ message: 'Too many messages. Please try again later' });
  }
 
  try {
    await pool.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, cleanPhone || null, subject, cleanMessage]
    );
    res.status(201).json({ message: 'Thank you. Your message has been sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not send your message. Please try again' });
  }
};
 
// GET /api/contact   (admin, staff)   optional ?status=new
exports.getMessages = async (req, res) => {
  try {
    const params = [];
    let where = '';
    if (req.query.status) {
      where = ' WHERE status = ?';
      params.push(req.query.status);
    }
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, subject, message, status, created_at
       FROM contact_messages${where} ORDER BY created_at DESC, id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/contact/:id/status   (admin, staff)   body: { status }
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
  }
 
  try {
    const [result] = await pool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
