const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host:     process.env.PG_HOST     || 'localhost',
        port:     parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'aeronetb',
        user:     process.env.PG_USER     || 'postgres',
        password: process.env.PG_PASSWORD || 'yourpassword',
      }
);

pool.on('error', (err) => console.error('PG error:', err));
module.exports = pool;