const { open } = require('sqlite')
const sqlite3  = require('sqlite3')
const path     = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'vaultword.db')

let db

async function getDb() {
  if (db) return db
  db = await open({ filename: DB_PATH, driver: sqlite3.Database })
  await db.exec('PRAGMA journal_mode = WAL')
  await db.exec('PRAGMA foreign_keys = ON')
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS credentials (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      site               TEXT    NOT NULL,
      username           TEXT    NOT NULL,
      encrypted_password TEXT    NOT NULL,
      notes              TEXT,
      created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
  `)
  return db
}

module.exports = { getDb }
