const jwt = require('jsonwebtoken');
const pool = require('../db/postgres');

const JWT_SECRET = process.env.JWT_SECRET || 'aeronetb_super_secret_jwt_key_change_in_production_2025';

// Verify JWT and attach user to request
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role-based access control middleware factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
}

// Audit logger - call after successful DB write
async function logAction(empId, action, tableName, recordId, description, ip = null) {
  try {
    await pool.query(
      `INSERT INTO audit_log (emp_id, action, table_name, record_id, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [empId, action, tableName, String(recordId), description, ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { authenticate, requireRole, logAction, JWT_SECRET };
