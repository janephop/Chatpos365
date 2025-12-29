'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'pos_chat.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
let db;

function initDatabase() {
  try {
    db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance
    
    // Create tables
    createTables();
    console.log('✅ Database initialized:', DB_FILE);
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

function createTables() {
  // Chats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      user_id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      platform TEXT,
      online INTEGER DEFAULT 0,
      time TEXT,
      unread INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      tags TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT,
      sender TEXT,
      type TEXT DEFAULT 'text',
      time TEXT,
      timestamp INTEGER,
      image_url TEXT,
      video_url TEXT,
      audio_url TEXT,
      file_url TEXT,
      file_name TEXT,
      sticker_id TEXT,
      package_id TEXT,
      latitude REAL,
      longitude REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES chats(user_id)
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Online Bills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS online_bills (
      id TEXT PRIMARY KEY,
      bill_number TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      status TEXT,
      items TEXT,
      total_amount REAL,
      shipping_cost REAL,
      discount REAL,
      payment_method TEXT,
      bank_account_id TEXT,
      shipping_company_id TEXT,
      tracking_number TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Shop Data table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_data (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Bank Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      bank TEXT,
      name TEXT,
      number TEXT,
      account_holder TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Shipping Companies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      icon TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON online_bills(status);
    CREATE INDEX IF NOT EXISTS idx_bills_created_at ON online_bills(created_at);
  `);
}

// Sync JSON to SQLite
function syncJsonToDatabase() {
  try {
    const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
    const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
    const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
    const BILLS_FILE = path.join(DATA_DIR, 'online_bills.json');
    const SHOP_DATA_FILE = path.join(DATA_DIR, 'shop_data.json');
    const BANK_ACCOUNTS_FILE = path.join(DATA_DIR, 'bank_accounts.json');
    const SHIPPING_COMPANIES_FILE = path.join(DATA_DIR, 'shipping_companies.json');

    // Sync Chats
    if (fs.existsSync(CHATS_FILE)) {
      const chats = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO chats 
        (user_id, name, avatar, platform, online, time, unread, is_pinned, tags, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);
      
      const insertMany = db.transaction((chats) => {
        for (const [userId, chat] of Object.entries(chats)) {
          stmt.run(
            userId,
            chat.name || '',
            chat.avatar || '',
            chat.platform || 'line',
            chat.online ? 1 : 0,
            chat.time || '',
            chat.unread || 0,
            chat.isPinned ? 1 : 0,
            JSON.stringify(chat.tags || [])
          );
        }
      });
      
      insertMany(chats);
      console.log('✅ Synced chats to database');
    }

    // Sync Messages
    if (fs.existsSync(MESSAGES_FILE)) {
      const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO messages 
        (id, user_id, text, sender, type, time, timestamp, image_url, video_url, 
         audio_url, file_url, file_name, sticker_id, package_id, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertMany = db.transaction((messages) => {
        for (const [userId, msgs] of Object.entries(messages)) {
          msgs.forEach((msg, index) => {
            const msgId = msg.id || `${userId}_${index}_${msg.timestamp || Date.now()}`;
            stmt.run(
              msgId,
              userId,
              msg.text || '',
              msg.sender || 'user',
              msg.type || 'text',
              msg.time || '',
              msg.timestamp || Date.now(),
              msg.imageUrl || null,
              msg.videoUrl || null,
              msg.audioUrl || null,
              msg.fileUrl || null,
              msg.fileName || null,
              msg.stickerId || null,
              msg.packageId || null,
              msg.latitude || null,
              msg.longitude || null
            );
          });
        }
      });
      
      insertMany(messages);
      console.log('✅ Synced messages to database');
    }

    // Sync Settings
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, strftime('%s', 'now'))
      `);
      
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, JSON.stringify(value));
      }
      console.log('✅ Synced settings to database');
    }

    // Sync Bills
    if (fs.existsSync(BILLS_FILE)) {
      const bills = JSON.parse(fs.readFileSync(BILLS_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO online_bills 
        (id, bill_number, customer_name, customer_phone, customer_address, status,
         items, total_amount, shipping_cost, discount, payment_method, 
         bank_account_id, shipping_company_id, tracking_number, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);
      
      const insertMany = db.transaction((bills) => {
        bills.forEach(bill => {
          stmt.run(
            bill.id,
            bill.billNumber || '',
            bill.customerName || '',
            bill.customerPhone || '',
            bill.customerAddress || '',
            bill.status || 'draft',
            JSON.stringify(bill.items || []),
            bill.totalAmount || 0,
            bill.shippingCost || 0,
            bill.discount || 0,
            bill.paymentMethod || '',
            bill.bankAccountId || null,
            bill.shippingCompanyId || null,
            bill.trackingNumber || null,
            bill.notes || ''
          );
        });
      });
      
      insertMany(bills);
      console.log('✅ Synced bills to database');
    }

    // Sync Shop Data
    if (fs.existsSync(SHOP_DATA_FILE)) {
      const shopData = JSON.parse(fs.readFileSync(SHOP_DATA_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO shop_data (key, value, updated_at)
        VALUES (?, ?, strftime('%s', 'now'))
      `);
      
      for (const [key, value] of Object.entries(shopData)) {
        stmt.run(key, JSON.stringify(value));
      }
      console.log('✅ Synced shop data to database');
    }

    // Sync Bank Accounts
    if (fs.existsSync(BANK_ACCOUNTS_FILE)) {
      const bankAccounts = JSON.parse(fs.readFileSync(BANK_ACCOUNTS_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO bank_accounts 
        (id, bank, name, number, account_holder, updated_at)
        VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);
      
      const insertMany = db.transaction((accounts) => {
        accounts.forEach(account => {
          stmt.run(
            account.id,
            account.bank || '',
            account.name || '',
            account.number || '',
            account.accountHolder || ''
          );
        });
      });
      
      insertMany(bankAccounts);
      console.log('✅ Synced bank accounts to database');
    }

    // Sync Shipping Companies
    if (fs.existsSync(SHIPPING_COMPANIES_FILE)) {
      const shippingCompanies = JSON.parse(fs.readFileSync(SHIPPING_COMPANIES_FILE, 'utf8'));
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO shipping_companies 
        (id, name, price, icon, updated_at)
        VALUES (?, ?, ?, ?, strftime('%s', 'now'))
      `);
      
      const insertMany = db.transaction((companies) => {
        companies.forEach(company => {
          stmt.run(
            company.id,
            company.name || '',
            company.price || 0,
            company.icon || ''
          );
        });
      });
      
      insertMany(shippingCompanies);
      console.log('✅ Synced shipping companies to database');
    }

  } catch (error) {
    console.error('❌ Error syncing JSON to database:', error.message);
  }
}

// Get database instance
function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

// Export database file path
function getDatabasePath() {
  return DB_FILE;
}

module.exports = {
  initDatabase,
  getDatabase,
  getDatabasePath,
  syncJsonToDatabase,
  createTables
};

