const express = require('express');
const pool = require('../db/postgres');
const { authenticate, requireRole, logAction } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT po.*,
        s.business_name AS supplier_name, s.country AS supplier_country,
        u.full_name AS created_by_name,
        COUNT(ol.line_id) AS line_count
      FROM purchase_order po
      JOIN supplier s ON s.supplier_id = po.supplier_id
      JOIN app_user u ON u.emp_id = po.created_by
      LEFT JOIN order_line ol ON ol.order_id = po.order_id
      GROUP BY po.order_id, s.business_name, s.country, u.full_name
      ORDER BY po.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const po = await pool.query(`
      SELECT po.*, s.business_name AS supplier_name, u.full_name AS created_by_name
      FROM purchase_order po
      JOIN supplier s ON s.supplier_id = po.supplier_id
      JOIN app_user u ON u.emp_id = po.created_by
      WHERE po.order_id = $1`, [req.params.id]);
    if (!po.rows.length) return res.status(404).json({ error: 'Not found' });

    const lines = await pool.query(`
      SELECT ol.*, p.part_name, p.part_category
      FROM order_line ol JOIN part p ON p.part_id = ol.part_id
      WHERE ol.order_id = $1`, [req.params.id]);

    const shipments = await pool.query(
      'SELECT * FROM shipment WHERE order_id = $1', [req.params.id]);

    res.json({ ...po.rows[0], lines: lines.rows, shipments: shipments.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/orders
router.post('/', authenticate, requireRole('procurement', 'admin'), async (req, res) => {
  const { supplier_id, desired_delivery, notes, lines } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const total = (lines || []).reduce((s, l) => s + (l.quantity * l.unit_price_usd), 0);
    const po = await client.query(
      `INSERT INTO purchase_order (supplier_id, created_by, desired_delivery, notes, total_value_usd)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [supplier_id, req.user.emp_id, desired_delivery, notes, total]
    );
    const orderId = po.rows[0].order_id;
    for (const l of (lines || [])) {
      await client.query(
        `INSERT INTO order_line (order_id,part_id,quantity,unit_price_usd,line_total_usd)
         VALUES ($1,$2,$3,$4,$5)`,
        [orderId, l.part_id, l.quantity, l.unit_price_usd, l.quantity * l.unit_price_usd]
      );
    }
    await client.query('COMMIT');
    await logAction(req.user.emp_id, 'INSERT', 'purchase_order', orderId,
      `Created PO #${orderId} for supplier ${supplier_id}`, req.ip);
    res.status(201).json(po.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, requireRole('procurement', 'admin'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['placed','confirmed','dispatched','delivered','completed','cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    const extra = status === 'delivered' ? ', actual_delivery = CURRENT_DATE' : '';
    const result = await pool.query(
      `UPDATE purchase_order SET status = $1 ${extra} WHERE order_id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    await logAction(req.user.emp_id, 'UPDATE', 'purchase_order', req.params.id,
      `Status updated to ${status}`, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// SHIPMENTS
// ============================================================

// GET /api/shipments
router.get('/shipments/all', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sh.*, po.desired_delivery, po.status AS order_status,
        s.business_name AS supplier_name,
        su.location AS last_location, su.recorded_at AS last_update
      FROM shipment sh
      JOIN purchase_order po ON po.order_id = sh.order_id
      JOIN supplier s ON s.supplier_id = po.supplier_id
      LEFT JOIN LATERAL (
        SELECT location, recorded_at FROM shipment_update
        WHERE shipment_id = sh.shipment_id ORDER BY recorded_at DESC LIMIT 1
      ) su ON true
      ORDER BY sh.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shipments/:id
router.get('/shipments/:id', authenticate, async (req, res) => {
  try {
    const sh = await pool.query(`
      SELECT sh.*, s.business_name AS supplier_name, po.desired_delivery, po.status AS order_status
      FROM shipment sh
      JOIN purchase_order po ON po.order_id = sh.order_id
      JOIN supplier s ON s.supplier_id = po.supplier_id
      WHERE sh.shipment_id = $1`, [req.params.id]);
    if (!sh.rows.length) return res.status(404).json({ error: 'Not found' });

    const updates = await pool.query(
      'SELECT * FROM shipment_update WHERE shipment_id = $1 ORDER BY recorded_at',
      [req.params.id]);

    res.json({ ...sh.rows[0], updates: updates.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/shipments/:id/updates
router.post('/shipments/:id/updates', authenticate, requireRole('procurement','admin'), async (req, res) => {
  const { location, gps_lat, gps_lng, condition_notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO shipment_update (shipment_id, location, gps_lat, gps_lng, condition_notes, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, location, gps_lat, gps_lng, condition_notes, req.user.emp_id]
    );
    await logAction(req.user.emp_id, 'INSERT', 'shipment_update', result.rows[0].update_id,
      `Added checkpoint for shipment #${req.params.id}: ${location}`, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
