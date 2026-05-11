require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connectMongo } = require('./db/mongo');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/suppliers',   require('./routes/suppliers'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/qc-reports',  require('./routes/qcReports'));
app.use('/api',             require('./routes/misc'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Frontend fallback (SPA) ───────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start ─────────────────────────────────────────────────────
async function start() {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`\n🚀 AeroNetB server running on http://localhost:${PORT}`);
      console.log(`   PostgreSQL: ${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE || 'aeronetb'}`);
      console.log(`   MongoDB:    ${process.env.MONGO_URI || 'mongodb://localhost:27017'}/${process.env.MONGO_DB || 'aeronetb'}`);
      console.log(`\n   Demo credentials (all roles use: Password123!)`);
      console.log(`   alice@aeronetb.com  → Procurement Officer`);
      console.log(`   ben@aeronetb.com    → Quality Inspector`);
      console.log(`   clara@aeronetb.com  → Supply Chain Manager`);
      console.log(`   david@aeronetb.com  → Equipment Engineer`);
      console.log(`   eva@aeronetb.com    → Auditor`);
      console.log(`   admin@aeronetb.com  → Admin\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
