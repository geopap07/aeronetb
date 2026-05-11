-- AeroNetB - Dummy Data Inserts
-- Student ID: 100775840

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO supplier (business_name, address, country, contact_name, contact_email, contact_phone, accreditation_status, region) VALUES
('AeroFrame Technologies Ltd',     '14 Industrial Park, Bristol BS2 0QY', 'United Kingdom', 'James Hartley',   'j.hartley@aeroframe.co.uk',   '+44 117 900 1234', 'ISO 9001, AS9100', 'Europe'),
('Precision Wings GmbH',           'Flugzeugstr. 8, Hamburg 20457',       'Germany',        'Sabine Müller',   's.muller@precisionwings.de',  '+49 40 555 7890',  'AS9100',           'Europe'),
('SkyCore Composites Inc.',        '500 Aviation Blvd, Seattle WA 98101', 'USA',            'Robert Chen',     'r.chen@skycore.com',          '+1 206 555 4321',  'ISO 9001, AS9100', 'North America'),
('Eastern Aero Parts Co.',         '22 Pudong Ave, Shanghai 200120',      'China',          'Li Wei',          'l.wei@easternparts.cn',       '+86 21 6789 0123', 'ISO 9001',         'Asia Pacific'),
('Iberian Aerospace Solutions S.A','Av. de la Industria 45, Madrid 28108','Spain',          'Carmen Ruiz',     'c.ruiz@iberianspace.es',      '+34 91 456 7890',  'AS9100',           'Europe');

-- ============================================================
-- PARTS
-- ============================================================
INSERT INTO part (part_name, description, part_category, baseline_specs) VALUES
('A320 Fuselage Panel',    'Main fuselage skin panel for A320 series',          'Fuselage',  '{"tensile_strength_mpa": 480, "yield_point_mpa": 345, "fatigue_limit_mpa": 150, "material": "Al 2024-T3", "thickness_mm": 1.6}'),
('Wing Rib Assembly',      'Structural rib for wing box assembly',               'Wing',      '{"tensile_strength_mpa": 520, "yield_point_mpa": 380, "material": "Al 7075-T6", "weight_kg": 4.2}'),
('Landing Gear Bracket',   'Primary load-bearing bracket for main landing gear', 'Undercarriage', '{"tensile_strength_mpa": 900, "yield_point_mpa": 800, "material": "Ti-6Al-4V", "weight_kg": 2.8}'),
('Engine Mount Pylon',     'Forward engine attachment pylon structure',          'Propulsion', '{"tensile_strength_mpa": 950, "yield_point_mpa": 850, "material": "Ti-6Al-4V", "heat_treatment": "STA"}'),
('Hydraulic Actuator Rod', 'Flight control surface hydraulic actuator rod',      'Systems',   '{"tensile_strength_mpa": 1000, "material": "Steel 4340", "diameter_mm": 28, "chrome_plated": true}');

-- ============================================================
-- PART OFFERINGS (supplier-specific customisations)
-- ============================================================
INSERT INTO part_offering (part_id, supplier_id, unit_price_usd, lead_time_days, custom_features) VALUES
(1, 1, 4200.00, 45, '{"anti_corrosion_coating": "Alodine 1200", "rfid_embedded": true, "rfid_standard": "ISO 18000-6C"}'),
(1, 2, 3950.00, 60, '{"composite_layering": "reinforced CFRP overlay", "fatigue_life_increase_pct": 15, "shock_sensor_packaging": true}'),
(1, 3, 4500.00, 30, '{"heat_treatment": "optimised T3 process", "weight_reduction_pct": 3, "digital_twin_data": true}'),
(2, 1, 8100.00, 90, '{"surface_finish": "anodised type III", "inspection_cert": "NADCAP"}'),
(2, 4, 6800.00, 75, '{"material_variant": "7075-T651", "ultrasonic_inspected": true}'),
(3, 3, 15200.00, 120, '{"machining": "5-axis CNC", "surface_roughness_ra": 0.4, "lot_traceability": "full"}'),
(4, 5, 22000.00, 150, '{"weld_class": "AWS D17.1", "ndt_method": "radiographic + ultrasonic"}'),
(5, 2, 3100.00, 30,  '{"chrome_thickness_micron": 25, "hydraulic_rated_bar": 350}');

-- ============================================================
-- USERS (passwords are bcrypt of "Password123!")
-- ============================================================
INSERT INTO app_user (full_name, job_title, department, email, phone, role, password_hash, auth_limit, region_portfolio, cert_ids, specialization, assigned_facility, regulatory_agency, accreditation_id, audit_scope) VALUES
('Alice Morgan',    'Procurement Officer',   'Procurement',     'alice@aeronetb.com',   '+44 7911 000001', 'procurement', '$2b$10$rQnK9vL2mX1pZ3wY8uT4OeKjN5sF6gH7iJ8kL9mN0oP1qR2sT3uV', 500000.00, 'Europe, North America', NULL, NULL, NULL, NULL, NULL, NULL),
('Ben Okafor',      'Senior QC Inspector',   'Quality',         'ben@aeronetb.com',     '+44 7911 000002', 'inspector',   '$2b$10$rQnK9vL2mX1pZ3wY8uT4OeKjN5sF6gH7iJ8kL9mN0oP1qR2sT3uV', NULL, NULL, 'CERT-NDT-001,CERT-DIM-005', 'NDT, Dimensional Analysis', NULL, NULL, NULL, NULL),
('Clara Shepherd',  'Supply Chain Manager',  'Operations',      'clara@aeronetb.com',   '+44 7911 000003', 'manager',     '$2b$10$rQnK9vL2mX1pZ3wY8uT4OeKjN5sF6gH7iJ8kL9mN0oP1qR2sT3uV', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('David Kim',       'Equipment Engineer',    'Engineering',     'david@aeronetb.com',   '+44 7911 000004', 'engineer',    '$2b$10$rQnK9vL2mX1pZ3wY8uT4OeKjN5sF6gH7iJ8kL9mN0oP1qR2sT3uV', NULL, NULL, NULL, 'CNC Machining, Hydraulics', 'Bristol Plant A', NULL, NULL, NULL),
('Eva Thornton',    'External Auditor',      'Compliance',      'eva@aeronetb.com',     '+44 7911 000005', 'auditor',     '$2b$10$rQnK9vL2mX1pZ3wY8uT4OeKjN5sF6gH7iJ8kL9mN0oP1qR2sT3uV', NULL, NULL, NULL, NULL, NULL, 'EASA', 'EASA-AU-2024-007', 'External compliance, Safety certification'),
('Admin User',      'System Administrator',  'IT',              'admin@aeronetb.com',   '+44 7911 000006', 'admin',       '$2b$10$rQnK9vL2mX1pZ3wY8uT4OeKjN5sF6gH7iJ8kL9mN0oP1qR2sT3uV', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ============================================================
-- EQUIPMENT
-- ============================================================
INSERT INTO equipment (equip_name, equip_type, facility, serial_number, status, assigned_engineer_id, installed_at) VALUES
('CNC Mill #1',         'CNC Machining Centre', 'Bristol Plant A', 'CNC-001-BPL',  'operational', 4, '2021-03-15'),
('CMM Station Alpha',   'Coordinate Measuring',  'Bristol Plant A', 'CMM-ALPHA-BPL','operational', 4, '2020-07-01'),
('Autoclave Unit 3',    'Composite Curing',      'Bristol Plant A', 'AUTO-003-BPL', 'warning',     4, '2019-11-20'),
('Heat Treatment Oven', 'Heat Treatment',        'Bristol Plant A', 'HTO-002-BPL',  'operational', 4, '2022-01-10'),
('NDT X-Ray Cabinet',   'Non-Destructive Test',  'Bristol Plant A', 'NDT-XR-001',   'operational', 4, '2023-05-05');

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
INSERT INTO purchase_order (supplier_id, created_by, order_date, desired_delivery, actual_delivery, status, total_value_usd, notes) VALUES
(1, 1, '2025-01-10', '2025-03-01', '2025-02-28', 'completed',  42000.00, 'Urgent order for A320 programme'),
(2, 1, '2025-01-20', '2025-03-20', NULL,          'dispatched', 39500.00, 'Standard quarterly batch'),
(3, 1, '2025-02-05', '2025-04-15', NULL,          'confirmed',  45000.00, 'New supplier trial order'),
(4, 1, '2025-02-15', '2025-05-01', NULL,          'placed',     68000.00, 'Wing rib bulk order'),
(5, 1, '2025-03-01', '2025-06-30', NULL,          'placed',     220000.00,'Engine mount pylon order'),
(1, 1, '2025-03-10', '2025-04-10', NULL,          'confirmed',  16200.00, 'Wing rib supplemental'),
(3, 1, '2024-11-01', '2024-12-20', '2024-12-18',  'completed',  90000.00, 'Q4 landing gear brackets');

-- ============================================================
-- ORDER LINES
-- ============================================================
INSERT INTO order_line (order_id, part_id, quantity, unit_price_usd, line_total_usd) VALUES
(1, 1, 10, 4200.00, 42000.00),
(2, 1, 10, 3950.00, 39500.00),
(3, 1,  5, 4500.00, 22500.00),
(3, 2,  2, 8100.00, 16200.00),  -- mixed order
(4, 2, 10, 6800.00, 68000.00),
(5, 4,  1,22000.00, 22000.00),
(6, 2,  2, 8100.00, 16200.00),
(7, 3,  6,15200.00, 91200.00);

-- ============================================================
-- SHIPMENTS
-- ============================================================
INSERT INTO shipment (order_id, tracking_ref, carrier, port_of_entry, eta, departed_at, arrived_at, status) VALUES
(1, 'AWB-20250115-001', 'DHL Air Freight',   'Heathrow LHR', '2025-02-28', '2025-01-20 08:00', '2025-02-28 14:30', 'delivered'),
(2, 'AWB-20250202-002', 'Lufthansa Cargo',   'Heathrow LHR', '2025-03-18', '2025-02-02 10:00', NULL,               'in_transit'),
(3, 'AWB-20250220-003', 'FedEx International','Heathrow LHR', '2025-04-12', NULL,               NULL,               'pending'),
(7, 'AWB-20241110-007', 'FedEx International','Los Angeles LAX','2024-12-18','2024-11-10 06:00','2024-12-18 09:00', 'delivered');

-- ============================================================
-- SHIPMENT UPDATES (location checkpoints)
-- ============================================================
INSERT INTO shipment_update (shipment_id, recorded_at, location, gps_lat, gps_lng, condition_notes, recorded_by) VALUES
(2, '2025-02-02 10:30', 'Hamburg Warehouse – departed',    53.5511,  9.9937, 'All containers sealed, temp normal', 1),
(2, '2025-02-05 14:00', 'Frankfurt Airport – in transit',  50.0379,  8.5622, 'Passed customs clearance', 1),
(2, '2025-02-10 09:00', 'Mid-Atlantic – airborne',         51.5074, -30.000, 'On schedule', 1),
(1, '2025-01-20 09:00', 'Bristol Supplier – collected',    51.4545,  -2.5879,'Goods collected, condition good', 1),
(1, '2025-02-20 15:00', 'Heathrow – customs clearance',    51.4700,  -0.4543,'Cleared customs, awaiting delivery', 1),
(1, '2025-02-28 14:30', 'AeroNetB Bristol – delivered',    51.4545,  -2.5879,'All items received, condition: good', 1);

-- ============================================================
-- DELIVERED ITEMS
-- ============================================================
INSERT INTO delivered_item (order_line_id, serial_number, batch_number, received_at, condition) VALUES
(1, 'FP-A320-2025-001', 'BATCH-AF-JAN25-01', '2025-02-28 14:30', 'good'),
(1, 'FP-A320-2025-002', 'BATCH-AF-JAN25-01', '2025-02-28 14:30', 'good'),
(1, 'FP-A320-2025-003', 'BATCH-AF-JAN25-01', '2025-02-28 14:30', 'good'),
(8, 'LGB-2024-C01',     'BATCH-SC-NOV24-LG', '2024-12-18 09:00', 'good'),
(8, 'LGB-2024-C02',     'BATCH-SC-NOV24-LG', '2024-12-18 09:00', 'good'),
(8, 'LGB-2024-C03',     'BATCH-SC-NOV24-LG', '2024-12-18 09:00', 'minor_damage');

-- ============================================================
-- CERTIFICATIONS
-- ============================================================
INSERT INTO certification (item_id, inspector_id, doc_ref, material_traceability, test_results, digital_signature, is_immutable, approved_at) VALUES
(1, 2, 'CERT-2025-FP-001', 'Raw material batch RM-2024-AL2024-007 from Hydro Aluminium AS, Norway',
 '{"dimensional_check": "pass", "surface_finish_ra": 0.8, "hardness_hv": 132, "ndt_result": "no_defects"}',
 'INS-SIG-BEN-2025-001', TRUE, '2025-03-05 09:00'),
(2, 2, 'CERT-2025-FP-002', 'Raw material batch RM-2024-AL2024-007 from Hydro Aluminium AS, Norway',
 '{"dimensional_check": "pass", "surface_finish_ra": 0.9, "hardness_hv": 130, "ndt_result": "no_defects"}',
 'INS-SIG-BEN-2025-002', TRUE, '2025-03-05 10:00'),
(4, 2, 'CERT-2024-LG-001', 'Titanium alloy batch TI-2024-6AL4V-012 from VSMPO-AVISMA, Russia',
 '{"dimensional_check": "pass", "tensile_test_mpa": 945, "ndt_method": "ultrasonic", "ndt_result": "no_defects"}',
 'INS-SIG-BEN-2024-003', TRUE, '2024-12-20 11:00');

-- ============================================================
-- AUDIT LOG (initial entries)
-- ============================================================
INSERT INTO audit_log (emp_id, action, table_name, record_id, description) VALUES
(1, 'INSERT', 'purchase_order', '1', 'Created PO #1 for supplier AeroFrame Technologies'),
(1, 'INSERT', 'purchase_order', '2', 'Created PO #2 for supplier Precision Wings GmbH'),
(2, 'INSERT', 'certification',  '1', 'Approved and locked certification CERT-2025-FP-001'),
(2, 'INSERT', 'certification',  '2', 'Approved and locked certification CERT-2025-FP-002'),
(2, 'INSERT', 'certification',  '3', 'Approved and locked certification CERT-2024-LG-001'),
(1, 'UPDATE', 'purchase_order', '1', 'Order status updated to completed');

COMMIT;
