const pool = require('../config/db');
 
const COLUMNS = `id, name, summary, description, price, whats_included, not_included,
                 duration_months, visit_frequency_months, response_time, suitable_for, is_active`;
 
// "line one\nline two" becomes ["line one", "line two"]
const toList = (text) =>
  text ? text.split('\n').map((line) => line.trim()).filter(Boolean) : [];
 
// What the browser receives: lists as real arrays, numbers as numbers.
const shape = (row) => ({
  ...row,
  price: Number(row.price),
  is_active: Boolean(row.is_active),
  whats_included: toList(row.whats_included),
  not_included: toList(row.not_included),
});
 
// Turns the text from the admin form into clean lines (or an error message).
function readLines(value, fieldName, { required }) {
  const raw = Array.isArray(value) ? value : String(value || '').split('\n');
  const lines = raw.map((line) => String(line).trim()).filter(Boolean);
 
  if (required && lines.length === 0) return { error: `Add at least one item to "${fieldName}"` };
  if (lines.length > 12) return { error: `"${fieldName}" can have at most 12 items` };
  if (lines.some((line) => line.length > 150)) return { error: `Each item in "${fieldName}" must be 150 characters or fewer` };
  return { lines };
}
 
// Checks every field of a service. Returns { error } or { values }.
function readService(body) {
  const name = String(body.name || '').trim();
  const summary = String(body.summary || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const responseTime = String(body.response_time || '').trim();
  const suitableFor = String(body.suitable_for || '').trim();
 
  if (name.length < 3 || name.length > 100) return { error: 'Name must be between 3 and 100 characters' };
  if (!summary || summary.length > 255) return { error: 'Add a short summary (up to 255 characters)' };
  if (description.length > 2000) return { error: 'Description must be 2000 characters or fewer' };
  if (!(price > 0) || price > 10000000) return { error: 'Price must be more than 0' };
  if (responseTime.length > 100) return { error: 'Response time must be 100 characters or fewer' };
  if (suitableFor.length > 150) return { error: 'Suitable for must be 150 characters or fewer' };
 
  const included = readLines(body.whats_included, "What's included", { required: true });
  if (included.error) return included;
  const notIncluded = readLines(body.not_included, 'Not included', { required: false });
  if (notIncluded.error) return notIncluded;
 
  const duration = body.duration_months === '' || body.duration_months == null ? null : Number(body.duration_months);
  if (duration !== null && !(Number.isInteger(duration) && duration >= 1 && duration <= 60)) {
    return { error: 'Duration must be a whole number of months between 1 and 60' };
  }
 
  const frequency = body.visit_frequency_months === '' || body.visit_frequency_months == null
    ? null : Number(body.visit_frequency_months);
  if (frequency !== null && ![1, 3, 6, 12].includes(frequency)) {
    return { error: 'Visit frequency must be 1, 3, 6 or 12 months' };
  }
 
  return {
    values: [
      name, summary, description || null, price,
      included.lines.join('\n'), notIncluded.lines.length ? notIncluded.lines.join('\n') : null,
      duration, frequency, responseTime || null, suitableFor || null,
    ],
  };
}
 
// GET /api/services   (public) -> services customers can buy
exports.getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM services WHERE is_active = TRUE ORDER BY id`);
    res.json(rows.map(shape));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/services/manage/all   (admin) -> every service, including hidden ones
exports.getAllServices = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM services ORDER BY id`);
    res.json(rows.map(shape));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// GET /api/services/:id   (public)
exports.getServiceById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${COLUMNS} FROM services WHERE id = ? AND is_active = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(shape(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// POST /api/services   (admin)
exports.createService = async (req, res) => {
  const { error, values } = readService(req.body);
  if (error) return res.status(400).json({ message: error });
 
  try {
    const [result] = await pool.query(
      `INSERT INTO services
         (name, summary, description, price, whats_included, not_included,
          duration_months, visit_frequency_months, response_time, suitable_for, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      values
    );
    res.status(201).json({ message: 'Service created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/services/:id   (admin)
exports.updateService = async (req, res) => {
  const { error, values } = readService(req.body);
  if (error) return res.status(400).json({ message: error });
 
  try {
    const [result] = await pool.query(
      `UPDATE services SET
         name = ?, summary = ?, description = ?, price = ?, whats_included = ?, not_included = ?,
         duration_months = ?, visit_frequency_months = ?, response_time = ?, suitable_for = ?
       WHERE id = ?`,
      [...values, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/services/:id/active   (admin)   body: { active: true/false }
// Services are hidden, never deleted, because old invoices still refer to them.
exports.setServiceActive = async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE services SET is_active = ? WHERE id = ?',
      [Boolean(req.body.active), req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: req.body.active ? 'Service is now visible' : 'Service is now hidden' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
