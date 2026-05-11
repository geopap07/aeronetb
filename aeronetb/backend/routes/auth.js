const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/postgres');
const { logAction, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query(
      'SELECT emp_id, full_name, email, role, password_hash, department, job_title FROM app_user WHERE email = $1',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { emp_id: user.emp_id, email: user.email, role: user.role,
        full_name: user.full_name, department: user.department },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAction(user.emp_id, 'LOGIN', 'app_user', user.emp_id, `User logged in`, req.ip);

    res.json({
      token,
      user: { emp_id: user.emp_id, full_name: user.full_name,
              email: user.email, role: user.role,
              department: user.department, job_title: user.job_title }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT emp_id, full_name, email, role, department, job_title, phone FROM app_user WHERE emp_id = $1',
      [req.user.emp_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
