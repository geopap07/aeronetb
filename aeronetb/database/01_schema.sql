-- AeroNetB Aerospace Supply Chain Management System
-- PostgreSQL Schema - Task 2 Implementation
-- Student ID: 100775840

-- Drop existing tables (in dependency order)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS certification CASCADE;
DROP TABLE IF EXISTS qc_report_ref CASCADE;
DROP TABLE IF EXISTS delivered_item CASCADE;
DROP TABLE IF EXISTS shipment_update CASCADE;
DROP TABLE IF EXISTS shipment CASCADE;
DROP TABLE IF EXISTS order_line CASCADE;
DROP TABLE IF EXISTS purchase_order CASCADE;
DROP TABLE IF EXISTS part_offering CASCADE;
DROP TABLE IF EXISTS part CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;

-- ============================================================
-- SUPPLIER
-- ============================================================
CREATE TABLE supplier (
    supplier_id     SERIAL PRIMARY KEY,
    business_name   VARCHAR(200) NOT NULL,
    address         TEXT,
    country         VARCHAR(100),
    contact_name    VARCHAR(150),
    contact_email   VARCHAR(150),
    contact_phone   VARCHAR(50),
    accreditation_status VARCHAR(100) DEFAULT 'Pending',
    region          VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PART
-- ============================================================
CREATE TABLE part (
    part_id         SERIAL PRIMARY KEY,
    part_name       VARCHAR(200) NOT NULL,
    description     TEXT,
    part_category   VARCHAR(100),
    baseline_specs  JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PART_OFFERING (supplier-specific customisations)
-- ============================================================
CREATE TABLE part_offering (
    offering_id         SERIAL PRIMARY KEY,
    part_id             INT NOT NULL REFERENCES part(part_id),
    supplier_id         INT NOT NULL REFERENCES supplier(supplier_id),
    unit_price_usd      NUMERIC(12,2),
    lead_time_days      INT,
    custom_features     JSONB,
    UNIQUE(part_id, supplier_id)
);

-- ============================================================
-- APP_USER (all roles)
-- ============================================================
CREATE TABLE app_user (
    emp_id          SERIAL PRIMARY KEY,
    full_name       VARCHAR(200) NOT NULL,
    job_title       VARCHAR(150),
    department      VARCHAR(100),
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(50),
    role            VARCHAR(50) NOT NULL CHECK (role IN ('procurement','inspector','manager','engineer','auditor','admin')),
    password_hash   VARCHAR(255) NOT NULL,
    auth_limit      NUMERIC(12,2),
    region_portfolio VARCHAR(200),
    cert_ids        TEXT,
    specialization  VARCHAR(200),
    assigned_facility VARCHAR(200),
    regulatory_agency VARCHAR(200),
    accreditation_id  VARCHAR(100),
    audit_scope       VARCHAR(200),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- EQUIPMENT
-- ============================================================
CREATE TABLE equipment (
    equip_id        SERIAL PRIMARY KEY,
    equip_name      VARCHAR(200) NOT NULL,
    equip_type      VARCHAR(100),
    facility        VARCHAR(200),
    serial_number   VARCHAR(100),
    status          VARCHAR(50) DEFAULT 'operational',
    assigned_engineer_id INT REFERENCES app_user(emp_id),
    installed_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PURCHASE_ORDER
-- ============================================================
CREATE TABLE purchase_order (
    order_id        SERIAL PRIMARY KEY,
    supplier_id     INT NOT NULL REFERENCES supplier(supplier_id),
    created_by      INT NOT NULL REFERENCES app_user(emp_id),
    order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    desired_delivery DATE,
    actual_delivery  DATE,
    status          VARCHAR(50) DEFAULT 'placed' CHECK (status IN ('placed','confirmed','dispatched','delivered','completed','cancelled')),
    total_value_usd NUMERIC(14,2),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDER_LINE
-- ============================================================
CREATE TABLE order_line (
    line_id         SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES purchase_order(order_id),
    part_id         INT NOT NULL REFERENCES part(part_id),
    quantity        INT NOT NULL DEFAULT 1,
    unit_price_usd  NUMERIC(12,2),
    line_total_usd  NUMERIC(14,2)
);

-- ============================================================
-- SHIPMENT
-- ============================================================
CREATE TABLE shipment (
    shipment_id     SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES purchase_order(order_id),
    tracking_ref    VARCHAR(100) UNIQUE,
    carrier         VARCHAR(150),
    port_of_entry   VARCHAR(150),
    eta             DATE,
    departed_at     TIMESTAMP,
    arrived_at      TIMESTAMP,
    status          VARCHAR(50) DEFAULT 'in_transit' CHECK (status IN ('pending','in_transit','arrived','cleared','delivered')),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SHIPMENT_UPDATE (location checkpoints)
-- ============================================================
CREATE TABLE shipment_update (
    update_id       SERIAL PRIMARY KEY,
    shipment_id     INT NOT NULL REFERENCES shipment(shipment_id),
    recorded_at     TIMESTAMP DEFAULT NOW(),
    location        VARCHAR(200),
    gps_lat         NUMERIC(9,6),
    gps_lng         NUMERIC(9,6),
    condition_notes TEXT,
    recorded_by     INT REFERENCES app_user(emp_id)
);

-- ============================================================
-- DELIVERED_ITEM (physical instance of a part)
-- ============================================================
CREATE TABLE delivered_item (
    item_id         SERIAL PRIMARY KEY,
    order_line_id   INT NOT NULL REFERENCES order_line(line_id),
    serial_number   VARCHAR(100) UNIQUE NOT NULL,
    batch_number    VARCHAR(100),
    received_at     TIMESTAMP DEFAULT NOW(),
    condition       VARCHAR(50) DEFAULT 'good'
);

-- ============================================================
-- CERTIFICATION (immutable once approved)
-- ============================================================
CREATE TABLE certification (
    cert_id         SERIAL PRIMARY KEY,
    item_id         INT NOT NULL REFERENCES delivered_item(item_id),
    inspector_id    INT NOT NULL REFERENCES app_user(emp_id),
    doc_ref         VARCHAR(200),
    material_traceability TEXT,
    test_results    JSONB,
    digital_signature VARCHAR(255),
    is_immutable    BOOLEAN DEFAULT FALSE,
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- QC_REPORT_REF (reference pointer to MongoDB document)
-- ============================================================
CREATE TABLE qc_report_ref (
    ref_id          SERIAL PRIMARY KEY,
    mongo_id        VARCHAR(100) NOT NULL,
    item_id         INT REFERENCES delivered_item(item_id),
    report_type     VARCHAR(100),
    status          VARCHAR(50) DEFAULT 'pending',
    created_by      INT REFERENCES app_user(emp_id),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AUDIT_LOG
-- ============================================================
CREATE TABLE audit_log (
    log_id          SERIAL PRIMARY KEY,
    emp_id          INT REFERENCES app_user(emp_id),
    action          VARCHAR(50) NOT NULL,
    table_name      VARCHAR(100),
    record_id       VARCHAR(100),
    description     TEXT,
    ip_address      VARCHAR(50),
    logged_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_po_supplier ON purchase_order(supplier_id);
CREATE INDEX idx_po_status ON purchase_order(status);
CREATE INDEX idx_shipment_order ON shipment(order_id);
CREATE INDEX idx_shipment_status ON shipment(status);
CREATE INDEX idx_audit_emp ON audit_log(emp_id);
CREATE INDEX idx_audit_logged ON audit_log(logged_at);
CREATE INDEX idx_cert_item ON certification(item_id);
CREATE INDEX idx_cert_immutable ON certification(is_immutable);

COMMIT;
