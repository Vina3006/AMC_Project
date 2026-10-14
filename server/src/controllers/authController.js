const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { validatePassword } = require('../utils/passwordRules');
 
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
 
    // the two password boxes must match
    if (confirm_password !== undefined && confirm_password !== password) {
      return res.status(400).json({ message: 'The two passwords do not match' });
    }
 
    // length, upper and lower case letters, number, special character, not too common
    const passwordProblem = validatePassword(password, { name, email });
    if (passwordProblem) {
      return res.status(400).json({ message: passwordProblem });
    }
 
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }
 
    const passwordHash = await bcrypt.hash(password, 10);
 
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
 
    res.status(201).json({ message: 'User registered successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
 
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
 
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
 
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
 
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
 