const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'whatsapp.db');

let db;

function initializeDatabase() {
  db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(15) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      about VARCHAR(200) DEFAULT 'Hey there! I am using WhatsApp',
      avatar VARCHAR(500) DEFAULT 'default-avatar.png',
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_online BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(15) NOT NULL,
      otp_code VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER REFERENCES users(id),
      user2_id INTEGER REFERENCES users(id),
      last_message_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER REFERENCES conversations(id),
      sender_id INTEGER REFERENCES users(id),
      receiver_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      message_type VARCHAR(20) DEFAULT 'text',
      status VARCHAR(20) DEFAULT 'sent',
      reply_to_id INTEGER REFERENCES messages(id) NULL,
      is_deleted BOOLEAN DEFAULT 0,
      is_deleted_for_everyone BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      token TEXT NOT NULL,
      socket_id VARCHAR(100),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invite_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      creator_id INTEGER NOT NULL REFERENCES users(id),
      expires_at DATETIME NOT NULL,
      used_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized successfully');
  return db;
}

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

module.exports = { initializeDatabase, getDb };
