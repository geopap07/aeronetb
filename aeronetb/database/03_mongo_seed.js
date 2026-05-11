// AeroNetB - MongoDB Seed Data
// Run with: node database/03_mongo_seed.js
// Student ID: 100775840

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'aeronetb';

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);

    // Drop existing collections
    await db.collection('qc_reports').drop().catch(() => {});
    await db.collection('iot_logs').drop().catch(() => {});
    console.log('Cleared existing collections');

    // ============================================================
    // QC REPORTS
    // ============================================================
    const qcReports = [
      {
        report_id: 'QC-2025-001',
        delivered_item_serial: 'FP-A320-2025-001',
        sql_item_id: 1,
        report_type: 'dimensional',
        overall_status: 'pass',
        created_by_emp_id: 2,
        created_by_name: 'Ben Okafor',
        part_name: 'A320 Fuselage Panel',
        supplier_name: 'AeroFrame Technologies Ltd',
        versions: [
          {
            version: 1,
            created_at: new Date('2025-03-01T09:00:00Z'),
            inspector_notes: 'Initial dimensional inspection. All measurements within tolerance.',
            measurements: {
              length_mm: { nominal: 2400, actual: 2399.8, tolerance: 0.5, result: 'pass' },
              width_mm:  { nominal: 1200, actual: 1200.1, tolerance: 0.5, result: 'pass' },
              thickness_mm: { nominal: 1.6, actual: 1.61, tolerance: 0.05, result: 'pass' },
              flatness_mm: { nominal: 0, actual: 0.12, tolerance: 0.2, result: 'pass' }
            },
            overall_result: 'pass'
          }
        ],
        created_at: new Date('2025-03-01T09:00:00Z'),
        updated_at: new Date('2025-03-01T09:00:00Z')
      },
      {
        report_id: 'QC-2025-002',
        delivered_item_serial: 'FP-A320-2025-002',
        sql_item_id: 2,
        report_type: 'ndt',
        overall_status: 'pass',
        created_by_emp_id: 2,
        created_by_name: 'Ben Okafor',
        part_name: 'A320 Fuselage Panel',
        supplier_name: 'AeroFrame Technologies Ltd',
        versions: [
          {
            version: 1,
            created_at: new Date('2025-03-02T10:00:00Z'),
            inspector_notes: 'Ultrasonic NDT inspection. No delamination or porosity detected.',
            ndt_data: {
              method: 'Ultrasonic (UT)',
              frequency_mhz: 5,
              scan_coverage_pct: 100,
              defects_found: [],
              attenuation_db: 12.4,
              result: 'no_defects'
            },
            overall_result: 'pass'
          },
          {
            version: 2,
            created_at: new Date('2025-03-03T14:30:00Z'),
            inspector_notes: 'Re-inspection requested by QC manager. Confirmed: no defects.',
            ndt_data: {
              method: 'Ultrasonic (UT)',
              frequency_mhz: 5,
              scan_coverage_pct: 100,
              defects_found: [],
              attenuation_db: 12.2,
              result: 'no_defects'
            },
            overall_result: 'pass'
          }
        ],
        created_at: new Date('2025-03-02T10:00:00Z'),
        updated_at: new Date('2025-03-03T14:30:00Z')
      },
      {
        report_id: 'QC-2025-003',
        delivered_item_serial: 'FP-A320-2025-003',
        sql_item_id: 3,
        report_type: 'visual',
        overall_status: 'fail',
        created_by_emp_id: 2,
        created_by_name: 'Ben Okafor',
        part_name: 'A320 Fuselage Panel',
        supplier_name: 'AeroFrame Technologies Ltd',
        versions: [
          {
            version: 1,
            created_at: new Date('2025-03-04T11:00:00Z'),
            inspector_notes: 'Surface corrosion detected on Panel 3. Minor pitting on trailing edge. Fails acceptance criteria.',
            visual_data: {
              surface_condition: 'corrosion_detected',
              defect_locations: ['trailing_edge_right', 'lower_surface_mid'],
              defect_severity: 'minor',
              photos_ref: ['QC-2025-003-IMG-001.jpg', 'QC-2025-003-IMG-002.jpg'],
              accept_reject: 'reject'
            },
            overall_result: 'fail'
          }
        ],
        created_at: new Date('2025-03-04T11:00:00Z'),
        updated_at: new Date('2025-03-04T11:00:00Z')
      },
      {
        report_id: 'QC-2024-007',
        delivered_item_serial: 'LGB-2024-C03',
        sql_item_id: 6,
        report_type: 'environmental',
        overall_status: 'pending',
        created_by_emp_id: 2,
        created_by_name: 'Ben Okafor',
        part_name: 'Landing Gear Bracket',
        supplier_name: 'SkyCore Composites Inc.',
        versions: [
          {
            version: 1,
            created_at: new Date('2024-12-20T14:00:00Z'),
            inspector_notes: 'Item received with minor cosmetic damage noted on delivery note. Environmental stress test pending.',
            environmental_data: {
              test_type: 'thermal_cycling',
              temperature_range_c: [-55, 85],
              cycles_completed: 0,
              cycles_required: 200,
              status: 'in_progress'
            },
            overall_result: 'pending'
          }
        ],
        created_at: new Date('2024-12-20T14:00:00Z'),
        updated_at: new Date('2024-12-20T14:00:00Z')
      }
    ];

    await db.collection('qc_reports').insertMany(qcReports);
    console.log(`Inserted ${qcReports.length} QC reports`);

    // ============================================================
    // IOT LOGS
    // ============================================================
    const now = new Date();
    const iotLogs = [];

    // Generate realistic sensor data for 5 equipment items over last 24 hours
    const equipment = [
      { device_id: 'DEV-CNC-001', equip_id: 1, equip_name: 'CNC Mill #1',      type: 'cnc' },
      { device_id: 'DEV-CMM-001', equip_id: 2, equip_name: 'CMM Station Alpha', type: 'cmm' },
      { device_id: 'DEV-AUTO-003',equip_id: 3, equip_name: 'Autoclave Unit 3',  type: 'autoclave' },
      { device_id: 'DEV-HTO-002', equip_id: 4, equip_name: 'Heat Treatment Oven',type: 'oven' },
      { device_id: 'DEV-NDT-001', equip_id: 5, equip_name: 'NDT X-Ray Cabinet', type: 'ndt' }
    ];

    for (const equip of equipment) {
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now - i * 3600000);
        let readings = {};

        if (equip.type === 'cnc') {
          readings = {
            temperature_c: +(68 + Math.random() * 10).toFixed(1),
            vibration_hz:  +(1.2 + Math.random() * 0.8).toFixed(2),
            spindle_rpm:   Math.round(3000 + Math.random() * 2000),
            coolant_temp_c:+(22 + Math.random() * 5).toFixed(1),
            status: 'running'
          };
        } else if (equip.type === 'cmm') {
          readings = {
            temperature_c: +(20 + Math.random() * 2).toFixed(1),
            humidity_pct:  +(45 + Math.random() * 10).toFixed(1),
            vibration_hz:  +(0.1 + Math.random() * 0.1).toFixed(3),
            status: 'operational'
          };
        } else if (equip.type === 'autoclave') {
          // Autoclave has a warning state
          const temp = 175 + Math.random() * 30;
          readings = {
            temperature_c: +temp.toFixed(1),
            pressure_bar:  +(6.5 + Math.random() * 1.5).toFixed(2),
            cycle_time_min: Math.round(120 + Math.random() * 60),
            status: temp > 195 ? 'warning' : 'running'
          };
        } else if (equip.type === 'oven') {
          readings = {
            temperature_c: +(480 + Math.random() * 40).toFixed(1),
            pressure_bar:  +(1.0 + Math.random() * 0.2).toFixed(2),
            atmosphere: 'nitrogen',
            status: 'running'
          };
        } else if (equip.type === 'ndt') {
          readings = {
            kv_setting:    Math.round(100 + Math.random() * 60),
            ma_setting:    +(2 + Math.random() * 3).toFixed(1),
            exposure_time_s: +(0.5 + Math.random() * 2).toFixed(1),
            status: 'operational'
          };
        }

        iotLogs.push({
          device_id: equip.device_id,
          equipment_id: equip.equip_id,
          equipment_name: equip.equip_name,
          equipment_type: equip.type,
          facility: 'Bristol Plant A',
          timestamp,
          readings
        });
      }
    }

    await db.collection('iot_logs').insertMany(iotLogs);
    console.log(`Inserted ${iotLogs.length} IoT log entries`);

    // Create indexes
    await db.collection('qc_reports').createIndex({ report_id: 1 }, { unique: true });
    await db.collection('qc_reports').createIndex({ sql_item_id: 1 });
    await db.collection('qc_reports').createIndex({ overall_status: 1 });
    await db.collection('iot_logs').createIndex({ device_id: 1, timestamp: -1 });
    await db.collection('iot_logs').createIndex({ equipment_id: 1 });
    console.log('Created indexes');

    console.log('\n✅ MongoDB seeding complete!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.close();
  }
}

seed();
