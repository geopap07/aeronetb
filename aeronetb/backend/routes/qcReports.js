const express = require('express');
const { ObjectId } = require('mongodb');
const { getMongo } = require('../db/mongo');
const { authenticate, requireRole, logAction } = require('../middleware/auth');

const router = express.Router();

// GET /api/qc-reports
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getMongo();
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.overall_status = status;
    if (type)   filter.report_type = type;

    const reports = await db.collection('qc_reports')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/qc-reports/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getMongo();
    const report = await db.collection('qc_reports').findOne({
      $or: [
        { report_id: req.params.id },
        ...(ObjectId.isValid(req.params.id) ? [{ _id: new ObjectId(req.params.id) }] : [])
      ]
    });
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/qc-reports - inspector only
router.post('/', authenticate, requireRole('inspector', 'admin'), async (req, res) => {
  try {
    const db = getMongo();
    const { delivered_item_serial, sql_item_id, report_type, part_name, supplier_name, inspector_notes, measurements, ndt_data, visual_data, environmental_data } = req.body;

    // Generate report_id
    const count = await db.collection('qc_reports').countDocuments();
    const reportId = `QC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const version = {
      version: 1,
      created_at: new Date(),
      inspector_notes: inspector_notes || '',
      overall_result: 'pending'
    };
    if (measurements)    version.measurements = measurements;
    if (ndt_data)        version.ndt_data = ndt_data;
    if (visual_data)     version.visual_data = visual_data;
    if (environmental_data) version.environmental_data = environmental_data;

    const doc = {
      report_id: reportId,
      delivered_item_serial, sql_item_id, report_type,
      overall_status: 'pending',
      part_name, supplier_name,
      created_by_emp_id: req.user.emp_id,
      created_by_name: req.user.full_name,
      versions: [version],
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('qc_reports').insertOne(doc);
    await logAction(req.user.emp_id, 'INSERT', 'qc_reports', reportId,
      `Created QC report ${reportId} for item ${delivered_item_serial}`, req.ip);

    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/qc-reports/:id — add new version (inspector only)
router.patch('/:id', authenticate, requireRole('inspector', 'admin'), async (req, res) => {
  try {
    const db = getMongo();
    const { inspector_notes, overall_result, measurements, ndt_data, visual_data, overall_status } = req.body;

    const existing = await db.collection('qc_reports').findOne({ report_id: req.params.id });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const nextVersion = existing.versions.length + 1;
    const newVersion = {
      version: nextVersion,
      created_at: new Date(),
      inspector_notes: inspector_notes || '',
      overall_result: overall_result || 'pending'
    };
    if (measurements) newVersion.measurements = measurements;
    if (ndt_data)     newVersion.ndt_data = ndt_data;
    if (visual_data)  newVersion.visual_data = visual_data;

    await db.collection('qc_reports').updateOne(
      { report_id: req.params.id },
      {
        $push: { versions: newVersion },
        $set: {
          overall_status: overall_status || existing.overall_status,
          updated_at: new Date()
        }
      }
    );

    await logAction(req.user.emp_id, 'UPDATE', 'qc_reports', req.params.id,
      `Added version ${nextVersion} to QC report ${req.params.id}`, req.ip);

    const updated = await db.collection('qc_reports').findOne({ report_id: req.params.id });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
