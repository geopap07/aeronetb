const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME   = process.env.MONGO_DB  || 'aeronetb';

let db = null;

async function connectMongo() {
  if (db) return db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('MongoDB connected:', DB_NAME);
  return db;
}

function getMongo() {
  if (!db) throw new Error('MongoDB not connected. Call connectMongo() first.');
  return db;
}

module.exports = { connectMongo, getMongo };
