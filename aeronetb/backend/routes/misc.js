const express = require('express');
const pool = require('../db/postgres');
const { getMongo } = require('../db/mongo');
const { authenticate, requireRole, logAction } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// CERTIFICATIONS
// ============================================================

// GET /api/certifications
router.get('/certifications', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, di.serial_number, di.batch_number,
        u.full_name AS inspector_name,
        p.part_name, s.business_name AS supplier_name
      FROM certification c
      JOIN delivered_item di ON di.item_id = c.item_id
      JOIN app_user u ON u.emp_id = c.inspector_id
      JOIN order_line ol ON ol.line_id = di.order_line_id
      JOIN part p ON p.part_id = ol.part_id
      JOIN purchase_order po ON po.order_id = ol.order_id
      JOIN supplier s ON s.supplier_id = po.supplier_id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/certifications - inspector only
router.post('/certifications', authenticate, requireRole('inspector', 'admin'), async (req, res) => {
  const { item_id, doc_ref, material_traceability, test_results, digital_signature } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO certification (item_id, inspector_id, doc_ref, material_traceability, test_results, digital_signature)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [item_id, req.user.emp_id, doc_ref, material_traceability,
       test_results ? JSON.stringify(test_results) : null, digital_signature]
    );
    await logAction(req.user.emp_id, 'INSERT', 'certification', result.rows[0].cert_id,
      `Created certification ${doc_ref} for item #${item_id}`, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/certifications/:id/approve - inspector only, makes immutable
router.post('/certifications/:id/approve', authenticate, requireRole('inspector', 'admin'), async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM certification WHERE cert_id = $1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Not found' });
    if (check.rows[0].is_immutable)
      return res.status(400).json({ error: 'Certification already approved and locked' });

    const result = await pool.query(
      `UPDATE certification SET is_immutable = TRUE, approved_at = NOW()
       WHERE cert_id = $1 RETURNING *`, [req.params.id]
    );
    await logAction(req.user.emp_id, 'APPROVE', 'certification', req.params.id,
      `Certification #${req.params.id} approved and locked (immutable)`, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// PARTS
// ============================================================
router.get('/parts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COUNT(DISTINCT po.offering_id) AS supplier_count,
        json_agg(json_build_object(
          'supplier_id', s.supplier_id, 'supplier_name', s.business_name,
          'unit_price_usd', po.unit_price_usd, 'lead_time_days', po.lead_time_days,
          'custom_features', po.custom_features
        )) AS offerings
      FROM part p
      LEFT JOIN part_offering po ON po.part_id = p.part_id
      LEFT JOIN supplier s ON s.supplier_id = po.supplier_id
      GROUP BY p.part_id
      ORDER BY p.part_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// IOT DATA
// ============================================================

// GET /api/iot/devices
router.get('/iot/devices', authenticate, requireRole('engineer', 'admin'), async (req, res) => {
  try {
    const db = getMongo();
    // Get latest reading per device
    const latest = await db.collection('iot_logs').aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
        _id: '$device_id',
        device_id: { $first: '$device_id' },
        equipment_id: { $first: '$equipment_id' },
        equipment_name: { $first: '$equipment_name' },
        equipment_type: { $first: '$equipment_type' },
        facility: { $first: '$facility' },
        last_seen: { $first: '$timestamp' },
        last_readings: { $first: '$readings' }
      }}
    ]).toArray();
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/iot/logs/:deviceId?hours=24
router.get('/iot/logs/:deviceId', authenticate, requireRole('engineer', 'admin'), async (req, res) => {
  try {
    const db = getMongo();
    const hours = parseInt(req.query.hours || '24');
    const since = new Date(Date.now() - hours * 3600000);

    const logs = await db.collection('iot_logs')
      .find({ device_id: req.params.deviceId, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// AUDIT LOG
// ============================================================
router.get('/audit-log', authenticate, requireRole('auditor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, u.full_name, u.role
      FROM audit_log al
      LEFT JOIN app_user u ON u.emp_id = al.emp_id
      ORDER BY al.logged_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// DASHBOARD STATS (manager)
// ============================================================
router.get('/dashboard/stats', authenticate, async (req, res) => {
  try {
    const [suppliers, orders, shipments, certs] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM supplier'),
      pool.query("SELECT COUNT(*) FROM purchase_order WHERE status NOT IN ('completed','cancelled')"),
      pool.query("SELECT COUNT(*) FROM shipment WHERE status = 'in_transit'"),
      pool.query('SELECT COUNT(*) FROM certification WHERE is_immutable = TRUE')
    ]);
    const db = getMongo();
    const qcFail = await db.collection('qc_reports').countDocuments({ overall_status: 'fail' });
    const qcTotal = await db.collection('qc_reports').countDocuments();

    res.json({
      total_suppliers: parseInt(suppliers.rows[0].count),
      active_orders:   parseInt(orders.rows[0].count),
      in_transit:      parseInt(shipments.rows[0].count),
      certifications:  parseInt(certs.rows[0].count),
      qc_fail_count:   qcFail,
      qc_total:        qcTotal
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
