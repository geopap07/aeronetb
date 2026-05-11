const express = require('express');
const pool = require('../db/postgres');
const { authenticate, requireRole, logAction } = require('../middleware/auth');

const router = express.Router();

// GET /api/suppliers - all roles
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
        COUNT(DISTINCT po.order_id) AS total_orders,
        ROUND(AVG(CASE WHEN po.actual_delivery <= po.desired_delivery THEN 100.0 ELSE 0 END), 1) AS on_time_pct
      FROM supplier s
      LEFT JOIN purchase_order po ON po.supplier_id = s.supplier_id
      GROUP BY s.supplier_id
      ORDER BY s.business_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const s = await pool.query('SELECT * FROM supplier WHERE supplier_id = $1', [req.params.id]);
    if (!s.rows.length) return res.status(404).json({ error: 'Not found' });

    const offerings = await pool.query(`
      SELECT po.*, p.part_name, p.part_category
      FROM part_offering po JOIN part p ON p.part_id = po.part_id
      WHERE po.supplier_id = $1`, [req.params.id]);

    res.json({ ...s.rows[0], offerings: offerings.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/suppliers/:id/performance - manager only
router.get('/:id/performance', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.supplier_id, s.business_name,
        COUNT(po.order_id) AS total_orders,
        COUNT(CASE WHEN po.status = 'completed' THEN 1 END) AS completed_orders,
        ROUND(AVG(CASE WHEN po.actual_delivery <= po.desired_delivery THEN 100.0 ELSE 0 END), 1) AS on_time_pct,
        COUNT(DISTINCT sh.shipment_id) AS total_shipments
      FROM supplier s
      LEFT JOIN purchase_order po ON po.supplier_id = s.supplier_id
      LEFT JOIN shipment sh ON sh.order_id = po.order_id
      WHERE s.supplier_id = $1
      GROUP BY s.supplier_id, s.business_name
    `, [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/suppliers - procurement + admin
router.post('/', authenticate, requireRole('procurement', 'admin'), async (req, res) => {
  const { business_name, address, country, contact_name, contact_email, contact_phone, accreditation_status, region } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO supplier (business_name,address,country,contact_name,contact_email,contact_phone,accreditation_status,region)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [business_name, address, country, contact_name, contact_email, contact_phone, accreditation_status || 'Pending', region]
    );
    await logAction(req.user.emp_id, 'INSERT', 'supplier', result.rows[0].supplier_id,
      `Created supplier: ${business_name}`, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
