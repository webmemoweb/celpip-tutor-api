import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

let db = null;
let SQL = null;

// Initialize database
export const initDatabase = async () => {
  SQL = await initSqlJs();
  
  // Always create fresh database (Railway'de her deploy'da sıfırlanır zaten)
  db = new SQL.Database();
  console.log('✅ New database created');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      is_premium INTEGER DEFAULT 0,
      premium_until TEXT,
      stripe_customer_id TEXT,
      demo_tasks_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stripe_payment_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'usd',
      status TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS task_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      task_type TEXT NOT NULL,
      task_mode TEXT NOT NULL,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database tables initialized');
  return db;
};

// Database helper functions
export const dbRun = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    
    // Get last insert ID
    const lastId = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0];
    console.log('DB Insert - Last ID:', lastId);
    
    return { lastInsertRowid: lastId || 1 };
  } catch (err) {
    console.error('DB Run Error:', err);
    throw err;
  }
};

export const dbGet = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const colNames = stmt.getColumnNames();
      const values = stmt.get();
      stmt.free();
      
      // Convert to object
      const row = {};
      colNames.forEach((col, i) => {
        row[col] = values[i];
      });
      return row;
    }
    stmt.free();
    return null;
  } catch (err) {
    console.error('DB Get Error:', err);
    return null;
  }
};

export const dbAll = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    const colNames = stmt.getColumnNames();
    
    while (stmt.step()) {
      const values = stmt.get();
      const row = {};
      colNames.forEach((col, i) => {
        row[col] = values[i];
      });
      rows.push(row);
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error('DB All Error:', err);
    return [];
  }
};

export const getDb = () => db;

export default { initDatabase, dbRun, dbGet, dbAll, getDb };
