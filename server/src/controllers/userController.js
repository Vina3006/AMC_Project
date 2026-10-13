const pool = require('../config/db');
 
const ROLES = ['admin', 'staff', 'technician', 'customer'];
 
// GET /api/users   (admin)   optional ?role=customer  ?q=text
exports.getUsers = async (req, res) => {
  try {
    const conditions = [];
    const params = [];
 
    if (req.query.role) {
      conditions.push('u.role = ?');
      params.push(req.query.role);
    }
    if (req.query.q) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${req.query.q}%`, `%${req.query.q}%`);
    }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
 
    // never select the password column
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, c.id AS client_id, c.name AS client_name
       FROM users u
       LEFT JOIN clients c ON c.user_id = u.id
       ${where}
       ORDER BY u.id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
// PUT /api/users/:id/role   (admin)   body: { role }
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
 
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${ROLES.join(', ')}` });
  }
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }
 
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
 
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
 
    // only customers can be linked to a client, so remove the link for other roles
    if (role !== 'customer') {
      await pool.query('UPDATE clients SET user_id = NULL WHERE user_id = ?', [req.params.id]);
    }
 
    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Could not update the role. Check that the users.role column allows this value.',
    });
  }
};
 
