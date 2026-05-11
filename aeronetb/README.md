# AeroNetB — Aerospace Supply Chain Management System
## 5CM506 Data Driven Systems — Task 2
### Student ID: 100775840

---

## Prerequisites

Install these before starting:
- **Node.js** v18+ → https://nodejs.org
- **PostgreSQL** v14+ → https://www.postgresql.org/download/
- **MongoDB Community** v6+ → https://www.mongodb.com/try/download/community

---

## Setup (5 steps)

### Step 1 — Clone / extract the project
```
aeronetb/
  backend/       ← Node.js Express API
  frontend/      ← HTML/CSS/JS dashboard
  database/      ← SQL and MongoDB seed scripts
```

### Step 2 — Configure environment
```bash
cd backend
cp .env.example .env
```
Open `.env` and set your PostgreSQL password:
```
PG_PASSWORD=yourpassword
```
Everything else can stay as default if running locally.

### Step 3 — Set up PostgreSQL database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE aeronetb;
```
Then run the SQL scripts:
```bash
psql -U postgres -d aeronetb -f database/01_schema.sql
psql -U postgres -d aeronetb -f database/02_dummy_data.sql
```
Or in pgAdmin: open Query Tool, paste contents of each file, and execute.

### Step 4 — Install Node dependencies and seed MongoDB
```bash
cd backend
npm install

# Seed MongoDB (make sure MongoDB is running first)
node ../database/03_mongo_seed.js
```

### Step 5 — Start the server
```bash
cd backend
node server.js
```
You should see:
```
🚀 AeroNetB server running on http://localhost:3000
```

Open your browser at: **http://localhost:3000**

---

## Demo Login Credentials
All accounts use password: **Password123!**

| Email | Role |
|---|---|
| alice@aeronetb.com | Procurement Officer |
| ben@aeronetb.com | Quality Inspector |
| clara@aeronetb.com | Supply Chain Manager |
| david@aeronetb.com | Equipment Engineer |
| eva@aeronetb.com | Auditor / Regulator |
| admin@aeronetb.com | Admin (all views) |

---

## API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/suppliers | List all suppliers |
| POST | /api/suppliers | Create supplier |
| GET | /api/suppliers/:id/performance | Supplier KPIs |
| GET | /api/parts | List parts + offerings |
| GET | /api/orders | List purchase orders |
| POST | /api/orders | Create purchase order |
| PATCH | /api/orders/:id/status | Update order status |
| GET | /api/orders/shipments/all | All shipments |
| GET | /api/orders/shipments/:id | Shipment detail |
| POST | /api/orders/shipments/:id/updates | Add checkpoint |
| GET | /api/qc-reports | QC reports (MongoDB) |
| POST | /api/qc-reports | Create QC report |
| PATCH | /api/qc-reports/:id | Add version |
| GET | /api/certifications | List certifications |
| POST | /api/certifications | Create certification |
| POST | /api/certifications/:id/approve | Lock certification |
| GET | /api/iot/devices | IoT device status |
| GET | /api/iot/logs/:deviceId | Sensor logs |
| GET | /api/audit-log | Audit trail |
| GET | /api/dashboard/stats | Dashboard KPIs |

---

## Architecture

```
Browser (HTML/CSS/JS)
      ↕ REST API (JSON)
Node.js / Express (port 3000)
      ↕ pg         ↕ mongodb
  PostgreSQL    MongoDB
  (relational   (qc_reports,
   data)         iot_logs)
```

### PostgreSQL tables
suppliers, parts, part_offerings, app_users, equipment,
purchase_orders, order_lines, shipments, shipment_updates,
delivered_items, certifications, qc_report_refs, audit_log

### MongoDB collections
- `qc_reports` — versioned QC inspection documents
- `iot_logs` — time-series IoT sensor readings

---

## Security Features
- **JWT authentication** — 8-hour tokens, role embedded
- **RBAC** — every endpoint enforces role restrictions
- **Immutable certifications** — once approved, cannot be modified (HTTP 400)
- **Audit logging** — every INSERT/UPDATE/APPROVE/LOGIN recorded
- **QC versioning** — reports use append-only version arrays in MongoDB
