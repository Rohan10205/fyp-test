-- Vaultword Database Schema
-- This file serves as a reference; the schema is applied automatically by database.js on startup.

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    UNIQUE NOT NULL,
  password_hash TEXT    NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Credentials table
-- encrypted_password stores the AES-256-GCM ciphertext produced by the client.
-- The plaintext password is NEVER transmitted to or stored on the server.
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
