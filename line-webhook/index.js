'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { middleware, Client } = require('@line/bot-sdk');
const { replyMessage, config, updateConfig } = require('./line');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { initDatabase, getDatabase, syncJsonToDatabase, getDatabasePath } = require('./database');
const XLSX = require('xlsx');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// In-memory storage for chats and messages
const chats = new Map(); // Map<userId, chatData>
const messages = new Map(); // Map<userId, messages[]>

// File paths for persistent storage
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const CSV_FILE = path.join(DATA_DIR, 'messages_export.csv');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BILLS_FILE = path.join(DATA_DIR, 'online_bills.json');
const SHOP_DATA_FILE = path.join(DATA_DIR, 'shop_data.json');
const BANK_ACCOUNTS_FILE = path.join(DATA_DIR, 'bank_accounts.json');
const SHIPPING_COMPANIES_FILE = path.join(DATA_DIR, 'shipping_companies.json');

// Create directories if they don't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log('📁 Created data directory');
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
  console.log('📁 Created uploads directory');
}

// Default Settings
let settings = {
  customerPriceLevel: 1 // Default to Price 1
};

// Load data from files on startup
function loadData() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const chatsData = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
      Object.entries(chatsData).forEach(([userId, chat]) => {
        chats.set(userId, chat);
      });
      console.log(`✅ Loaded ${chats.size} chats from file`);
    }

    if (fs.existsSync(MESSAGES_FILE)) {
      const messagesData = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
      Object.entries(messagesData).forEach(([userId, msgs]) => {
        messages.set(userId, msgs);
      });
      const totalMessages = Array.from(messages.values()).reduce((sum, msgs) => sum + msgs.length, 0);
      console.log(`✅ Loaded ${totalMessages} messages from file`);
    }
    
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const savedSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        settings = { ...settings, ...savedSettings };
        console.log('✅ Loaded settings from file:', settings);
      } catch (e) {
        console.error('❌ Error loading settings:', e.message);
      }
    }
  } catch (error) {
    console.error('❌ Error loading data:', error.message);
  }
}

// Save data to files
function saveData() {
  try {
    // Save chats as JSON
    const chatsObj = {};
    chats.forEach((chat, userId) => {
      chatsObj[userId] = chat;
    });
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chatsObj, null, 2), 'utf8');

    // Save messages as JSON
    const messagesObj = {};
    messages.forEach((msgs, userId) => {
      messagesObj[userId] = msgs;
    });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesObj, null, 2), 'utf8');

    // Export to CSV for Excel
    let csvContent = 'Timestamp,Time,User ID,User Name,Sender,Message\n';
    messages.forEach((msgs, userId) => {
      const chat = chats.get(userId);
      const userName = chat ? chat.name : 'Unknown';
      msgs.forEach(msg => {
        const timestamp = msg.timestamp || Date.now();
        const time = msg.time || new Date(timestamp).toLocaleTimeString('th-TH');
        const text = (msg.text || '').replace(/"/g, '""'); // Escape quotes
        csvContent += `${timestamp},"${time}","${userId}","${userName}","${msg.sender}","${text}"\n`;
      });
    });
    fs.writeFileSync(CSV_FILE, csvContent, 'utf8');

    // Sync to database if available
    if (db) {
      try {
        const stmtChat = db.prepare(`
          INSERT OR REPLACE INTO chats 
          (user_id, name, avatar, platform, online, time, unread, is_pinned, tags, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);
        
        const insertChats = db.transaction((chatsObj) => {
          for (const [userId, chat] of Object.entries(chatsObj)) {
            stmtChat.run(
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
        
        insertChats(chatsObj);
        
        // Sync messages
        const stmtMsg = db.prepare(`
          INSERT OR REPLACE INTO messages 
          (id, user_id, text, sender, type, time, timestamp, image_url, video_url, 
           audio_url, file_url, file_name, sticker_id, package_id, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertMessages = db.transaction((messagesObj) => {
          for (const [userId, msgs] of Object.entries(messagesObj)) {
            msgs.forEach((msg, index) => {
              const msgId = msg.id || `${userId}_${index}_${msg.timestamp || Date.now()}`;
              stmtMsg.run(
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
        
        insertMessages(messagesObj);
        console.log('💾 Data synced to database');
      } catch (dbError) {
        console.error('⚠️  Database sync error:', dbError.message);
      }
    }

    console.log('💾 Data saved to files');
  } catch (error) {
    console.error('❌ Error saving data:', error.message);
  }
}

// Save settings
function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    console.log('💾 Settings saved');
  } catch (error) {
    console.error('❌ Error saving settings:', error.message);
  }
}

// Initialize database
let db;
try {
  db = initDatabase();
  // Sync JSON files to database on startup
  syncJsonToDatabase();
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  console.log('⚠️  Continuing with JSON-only mode');
}

// Load data on startup
loadData();

// Auto-restore from backup if exists (after deploy)
const backupFile = path.join(DATA_DIR, 'backup_data.json');
if (fs.existsSync(backupFile)) {
  try {
    console.log('📦 Found backup file, attempting auto-restore...');
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Restore chats
    if (backupData.chats && Array.isArray(backupData.chats)) {
      backupData.chats.forEach(chat => {
        const userId = chat.userId || chat.id;
        chats.set(userId, chat);
      });
      console.log(`✅ Restored ${backupData.chats.length} chats from backup`);
    }
    
    // Restore messages
    if (backupData.messages && typeof backupData.messages === 'object') {
      Object.entries(backupData.messages).forEach(([userId, msgs]) => {
        messages.set(userId, msgs);
      });
      console.log(`✅ Restored messages from ${Object.keys(backupData.messages).length} users`);
    }
    
    // Save to database and files
    if (db) {
      // Sync to database
      saveData();
    } else {
      saveData();
    }
    
    console.log('✅ Auto-restore completed successfully');
  } catch (error) {
    console.error('❌ Auto-restore failed:', error.message);
    console.log('⚠️  Continuing without restore');
  }
}

// Setup Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend communication (allow all origins for ngrok)
app.use(cors({
  origin: true, // Allow all origins (including ngrok)
  credentials: true
}));

// Handle OPTIONS for CORS preflight
app.options('/uploads/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// Handle HEAD requests
app.head('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).end();
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.m4a': 'audio/mp4',
    '.mp3': 'audio/mpeg',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end();
});

// Custom video streaming handler with proper Range request support
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.m4a': 'audio/mp4',
    '.mp3': 'audio/mpeg',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Handle Range requests for video streaming
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks
    const chunksize = (end - start) + 1;
    
    // Error handling for stream
    const file = fs.createReadStream(filePath, { start, end });
    
    file.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    file.pipe(res);
  } else {
    // No range request - send entire file
    const file = fs.createReadStream(filePath);
    
    file.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });

    file.pipe(res);
  }
});

// API endpoint to download files (force download, not open in browser)
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Get original filename from messages if available
  let downloadName = filename;
  messages.forEach((msgs) => {
    const fileMsg = msgs.find(m => m.fileUrl && m.fileUrl.includes(filename));
    if (fileMsg && fileMsg.fileName) {
      downloadName = fileMsg.fileName;
    }
  });

  res.download(filePath, downloadName);
});

// LINE Webhook middleware MUST come BEFORE express.json()
// Because LINE middleware needs raw body (Buffer) to verify signature
app.use('/webhook/line', (req, res, next) => {
  // Check if configuration is set
  if (!config.channelAccessToken || !config.channelSecret) {
    console.error('❌ LINE configuration not set!');
    return res.status(400).json({ 
      error: 'LINE configuration not set. Please configure via the frontend first.' 
    });
  }
  
  console.log('🔐 Verifying LINE signature...');
  console.log('Channel Secret (first 10 chars):', config.channelSecret.substring(0, 10) + '...');
  
  // Apply LINE middleware with current config (it handles raw body internally)
  const lineMiddleware = middleware(config);
  lineMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ LINE Signature Verification Failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    console.log('✅ LINE Signature Verified!');
    next();
  });
});

// Express JSON middleware for API endpoints (not webhook)
// เพิ่ม limit เป็น 50MB เพื่อรองรับข้อมูลบิลจำนวนมาก
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route - Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LINE Webhook Server is running',
    version: '1.0.0',
    endpoints: {
      webhook: '/webhook/line',
      config: '/config',
      api: {
        chats: '/api/chats',
        messages: '/api/chats/:userId/messages',
        bills: '/api/bills',
        products: '/api/products',
        settings: '/api/settings'
      }
    }
  });
});

// API endpoint to get settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

// API endpoint to update settings
app.post('/api/settings', (req, res) => {
  try {
    const { customerPriceLevel } = req.body;
    
    if (customerPriceLevel !== undefined) {
      settings.customerPriceLevel = parseInt(customerPriceLevel);
    }
    
    saveSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to get current configuration status
app.get('/api/config/status', (req, res) => {
  const hasToken = !!config.channelAccessToken && config.channelAccessToken !== 'your_channel_access_token_here';
  const hasSecret = !!config.channelSecret && config.channelSecret !== 'your_channel_secret_here';
  const hasNgrok = !!config.ngrokUrl && config.ngrokUrl !== '';
  
  res.json({
    configured: hasToken && hasSecret,
    hasToken,
    hasSecret,
    hasNgrok,
    ngrokUrl: config.ngrokUrl || '(not set)'
  });
});

// API endpoint for frontend to send config (POST /config)
app.post('/config', (req, res) => {
  try {
    const { channelAccessToken, channelSecret, ngrokUrl } = req.body;
    
    if (channelAccessToken) {
      config.channelAccessToken = channelAccessToken;
    }
    if (channelSecret) {
      config.channelSecret = channelSecret;
    }
    if (ngrokUrl !== undefined) {
      config.ngrokUrl = ngrokUrl;
    }
    
    // Update config in memory
    updateConfig(config);
    
    res.json({ success: true, message: 'Config updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to get all chats
app.get('/api/chats', (req, res) => {
  try {
    let chatList = [];
    
    // Try to get from database first (for offline-first and cross-device access)
    if (db) {
      const dbChats = db.prepare('SELECT * FROM chats ORDER BY updated_at DESC').all();
      
      chatList = dbChats.map(chat => {
        // Get message count and last message from database
        const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ?').get(chat.user_id).count;
        const lastMessage = db.prepare('SELECT text, time FROM messages WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1').get(chat.user_id);
        
        return {
          userId: chat.user_id,
          id: chat.user_id,
          name: chat.name,
          avatar: chat.avatar,
          platform: chat.platform,
          shopId: chat.platform === 'line' ? 'shop_line_1' : undefined, // Map platform to shopId for filtering
          online: chat.online === 1,
          time: lastMessage?.time || chat.time,
          unread: chat.unread,
          isPinned: chat.is_pinned === 1,
          tags: chat.tags ? JSON.parse(chat.tags) : [],
          messageCount: messageCount,
          lastMessage: lastMessage?.text || ''
        };
      });
      
      if (chatList.length > 0) {
        return res.json(chatList);
      }
    }
    
    // Fallback to memory (in-memory Map)
    chatList = Array.from(chats.values()).map(chat => ({
      ...chat,
      shopId: chat.platform === 'line' ? 'shop_line_1' : undefined, // Map platform to shopId for filtering
      messageCount: messages.get(chat.userId)?.length || 0,
      lastMessage: messages.get(chat.userId)?.[messages.get(chat.userId).length - 1]?.text || '',
      time: messages.get(chat.userId)?.[messages.get(chat.userId).length - 1]?.time || chat.time
    }));
    
    res.json(chatList);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// API endpoint to get messages for a specific chat
app.get('/api/chats/:userId/messages', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, fromTimestamp } = req.query;
    
    // Try to get from database first (for offline-first and cross-device access)
    if (db) {
      let query = 'SELECT * FROM messages WHERE user_id = ?';
      const params = [userId];
      
      if (fromTimestamp) {
        query += ' AND timestamp >= ?';
        params.push(parseInt(fromTimestamp));
      }
      
      query += ' ORDER BY timestamp ASC';
      
      if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
      }
      
      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
      
      const dbMessages = db.prepare(query).all(...params);
      
      // Convert database format to API format
      const formattedMessages = dbMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        type: msg.type,
        time: msg.time,
        timestamp: msg.timestamp,
        imageUrl: msg.image_url,
        videoUrl: msg.video_url,
        audioUrl: msg.audio_url,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        stickerId: msg.sticker_id,
        packageId: msg.package_id,
        latitude: msg.latitude,
        longitude: msg.longitude
      }));
      
      if (formattedMessages.length > 0) {
        return res.json(formattedMessages);
      }
    }
    
    // Fallback to memory (in-memory Map)
    const userMessages = messages.get(userId) || [];
    
    // Apply pagination if requested
    let result = userMessages;
    if (fromTimestamp) {
      result = result.filter(msg => (msg.timestamp || 0) >= parseInt(fromTimestamp));
    }
    if (offset) {
      result = result.slice(parseInt(offset));
    }
    if (limit) {
      result = result.slice(0, parseInt(limit));
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Cache for products data and file modification time
let productsCache = {
  data: null,
  lastModified: null,
  filePath: null
};

// Function to load products from SQL file
function loadProductsFromSQL() {
  try {
    const posDbPath = path.join(__dirname, '..', '..', 'postest');
    const productsSqlPath = path.join(posDbPath, 'public', 'sql', 'products.sql');
    
    // Check if file exists
    if (!fs.existsSync(productsSqlPath)) {
      console.warn(`⚠️ Products SQL file not found at: ${productsSqlPath}`);
      console.warn('   Please check if the path is correct relative to line-webhook folder.');
      return { products: [], lastModified: null };
    }
    
    // Get file modification time
    const stats = fs.statSync(productsSqlPath);
    const lastModified = stats.mtime.getTime();
    
    // Check if we need to reload (file changed or cache is empty)
    if (productsCache.data && productsCache.lastModified === lastModified && productsCache.filePath === productsSqlPath) {
      console.log('📦 Using cached products data');
      return { products: productsCache.data, lastModified };
    }
    
    console.log('🔄 Loading products from SQL file (file changed or cache empty)...');
    const sqlContent = fs.readFileSync(productsSqlPath, 'utf8');
    const products = [];
    
    // Parse SQL INSERT statements - iterate line by line for robustness
    // This handles complex product names with special characters better than regex
    const lines = sqlContent.split(/\r?\n/);
    
    for (const line of lines) {
      // Skip lines that are not INSERT statements for products table
      if (!line.match(/^\s*INSERT\s+INTO\s+products/i)) continue;

      try {
        // Extract content inside VALUES (...)
        // Captures everything between the first "VALUES (" and the last ");" or ")"
        const match = line.match(/VALUES\s*\((.*)\);?$/i);
        if (!match) continue;

        const valuesStr = match[1];

        // Parse values more carefully
        const values = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;
        
        for (let i = 0; i < valuesStr.length; i++) {
          const char = valuesStr[i];
          
          if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            current += char;
          } else if (inQuotes && char === quoteChar) {
            // Check for escaped quote
            if (i + 1 < valuesStr.length && valuesStr[i + 1] === quoteChar) {
              current += char + char;
              i++; // Skip next quote
            } else {
              inQuotes = false;
              quoteChar = null;
              current += char;
            }
          } else if (!inQuotes && char === ',') {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        if (current.trim()) {
          values.push(current.trim());
        }
        
        // Clean up values
        const cleanedValues = values.map(v => {
          v = v.trim();
          if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
            return v.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
          }
          if (v === 'NULL' || v === 'null') return null;
          return v;
        });
        
        if (cleanedValues.length >= 14) {
          const product = {
            id: cleanedValues[0] || '',
            sku: cleanedValues[1] || '',
            barcode: cleanedValues[2] || '',
            name: cleanedValues[3] || '',
            price: parseFloat(cleanedValues[4]) || 0,
            price2: cleanedValues[5] && cleanedValues[5] !== 'NULL' ? parseFloat(cleanedValues[5]) : null,
            price3: cleanedValues[6] && cleanedValues[6] !== 'NULL' ? parseFloat(cleanedValues[6]) : null,
            price4: cleanedValues[7] && cleanedValues[7] !== 'NULL' ? parseFloat(cleanedValues[7]) : null,
            price5: cleanedValues[8] && cleanedValues[8] !== 'NULL' ? parseFloat(cleanedValues[8]) : null,
            cost: parseFloat(cleanedValues[9]) || 0,
            category: cleanedValues[10] || '',
            stock: parseInt(cleanedValues[11]) || 0,
            description: cleanedValues[12] || null,
            image: cleanedValues[13] || null,
            tax_rate: cleanedValues[14] && cleanedValues[14] !== 'NULL' ? parseFloat(cleanedValues[14]) : null
          };
          
          // Fix image path if exists - point to backend API
          if (product.image && !product.image.startsWith('http') && !product.image.startsWith('data:')) {
            // Remove leading slash if exists, then add /api/products/images/ prefix
            const imagePath = product.image.startsWith('/') ? product.image.slice(1) : product.image;
            product.image = `http://localhost:3000/api/products/images/${imagePath}`;
          }
          
          products.push(product);
        }
      } catch (err) {
        console.error('Error parsing product line:', err.message);
        // Continue with next product
      }
    }
    
    // Update cache
    productsCache = {
      data: products,
      lastModified: lastModified,
      filePath: productsSqlPath
    };
    
    console.log(`✅ Loaded ${products.length} products from SQL file`);
    return { products, lastModified };
  } catch (error) {
    console.error('❌ Error loading products:', error);
    return { products: [], lastModified: null };
  }
}

// API endpoint to get products from POS database
app.get('/api/products', (req, res) => {
  try {
    const posDbPath = path.join(__dirname, '..', '..', 'postest');
    const productsSqlPath = path.join(posDbPath, 'public', 'sql', 'products.sql');
    
    console.log('🔍 Looking for products at:', productsSqlPath);
    
    // Load products (will use cache if file hasn't changed)
    const { products, lastModified } = loadProductsFromSQL();
    
    if (products.length > 0) {
      return res.json({
        success: true,
        products: products,
        count: products.length,
        source: 'sql',
        lastModified: lastModified
      });
    }
    
    // If no file found, return empty array
    res.json({
      success: true,
      products: [],
      count: 0,
      source: 'none',
      message: 'ไม่พบไฟล์ database ของ POS ที่: ' + productsSqlPath
    });
  } catch (error) {
    console.error('❌ Error loading products:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      products: [],
      count: 0
    });
  }
});

// API endpoint to serve product images
app.get('/api/products/images/*', (req, res) => {
  try {
    const imagePath = req.params[0]; // Get everything after /api/products/images/
    const posDbPath = path.join(__dirname, '..', '..', 'postest');
    const fullImagePath = path.join(posDbPath, 'public', imagePath);
    
    // Security: prevent directory traversal
    const normalizedPath = path.normalize(fullImagePath);
    const publicPath = path.join(posDbPath, 'public');
    if (!normalizedPath.startsWith(publicPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Send image file
    res.sendFile(normalizedPath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// API endpoint to send a message to LINE user
app.post('/api/chats/:userId/messages', async (req, res) => {
  const { userId } = req.params;
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const client = new Client(config);
    await client.pushMessage(userId, {
      type: 'text',
      text: text
    });

    // Store sent message
    if (!messages.has(userId)) {
      messages.set(userId, []);
    }
    messages.get(userId).push({
      id: Date.now(),
      text: text,
      sender: 'admin',
      type: 'text',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    });

    // Save to file after sending message
    saveData();

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// API endpoint to upload and send file/image to LINE user
app.post('/api/chats/:userId/upload', upload.single('file'), async (req, res) => {
  const { userId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Determine base URL: use Railway URL if available, otherwise use ngrok URL
    // Railway sets RAILWAY_PUBLIC_DOMAIN or we can use request hostname
    let baseUrl = config.ngrokUrl;
    
    // Check if running on Railway (production)
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      console.log('✅ Using Railway URL:', baseUrl);
    } else if (process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
      // Try to get from request or use known Railway URL
      const railwayUrl = process.env.RAILWAY_URL || 'https://chatpos365-production.up.railway.app';
      baseUrl = railwayUrl;
      console.log('✅ Using Railway URL (from env):', baseUrl);
    }
    
    // Fallback check: if ngrok URL is not set and we're not on Railway
    if (!baseUrl || baseUrl === '' || baseUrl === 'http://localhost:3000') {
      console.error('❌ Base URL not configured:', baseUrl);
      return res.status(400).json({ 
        error: 'กรุณาตั้งค่า ngrok URL หรือ Railway URL ในหน้า Settings → LINE Official Account ก่อนส่งไฟล์',
        hint: 'ต้องการ URL เพื่อให้ LINE เข้าถึงไฟล์ได้'
      });
    }

    const client = new Client(config);
    const filename = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileExtension = path.extname(originalName).toLowerCase();
    const fileUrl = `/uploads/${filename}`;
    const fullUrl = `${baseUrl}${fileUrl}`;
    
    console.log(`📤 Preparing to send ${mimeType} file to LINE`);
    console.log(`   - File: ${originalName}`);
    console.log(`   - Full URL: ${fullUrl}`);
    console.log(`   - Base URL: ${baseUrl}`);

    let lineMessage;
    let messageData = {
      id: Date.now(),
      sender: 'admin',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    // Determine file type and create appropriate LINE message
    if (mimeType.startsWith('image/')) {
      // Send as image message
      lineMessage = {
        type: 'image',
        originalContentUrl: fullUrl,
        previewImageUrl: fullUrl
      };
      messageData.type = 'image';
      messageData.imageUrl = fileUrl;
      messageData.text = '📷 ส่งรูปภาพ';
    } 
    else if (mimeType.startsWith('video/')) {
      // Send as video message (LINE will display it as a video player)
      // LINE requires HTTPS URL and the video must be accessible
      lineMessage = {
        type: 'video',
        originalContentUrl: fullUrl,
        previewImageUrl: fullUrl // Use video URL as preview (LINE will extract frame)
      };
      messageData.type = 'video';
      messageData.videoUrl = fileUrl;
      messageData.text = '🎥 ส่งวิดีโอ';
      console.log(`   - Video sent as video message: ${fullUrl}`);
    }
    else if (mimeType.startsWith('audio/')) {
      // Send as audio message
      lineMessage = {
        type: 'audio',
        originalContentUrl: fullUrl,
        duration: 60000 // Placeholder duration
      };
      messageData.type = 'audio';
      messageData.audioUrl = fileUrl;
      messageData.text = '🎵 ส่งไฟล์เสียง';
    }
    else {
      // For other files, send as text with link
      lineMessage = {
        type: 'text',
        text: `📎 ไฟล์: ${originalName}\n${fullUrl}`
      };
      messageData.type = 'file';
      messageData.fileUrl = fileUrl;
      messageData.fileName = originalName;
      messageData.text = `📎 ส่งไฟล์: ${originalName}`;
    }

    // Send to LINE
    await client.pushMessage(userId, lineMessage);

    // Store sent message
    if (!messages.has(userId)) {
      messages.set(userId, []);
    }
    messages.get(userId).push(messageData);

    // Save to file
    saveData();

    console.log(`✅ Sent ${messageData.type} to ${userId}: ${originalName}`);

    res.json({ 
      success: true, 
      message: 'File sent successfully',
      fileUrl: fileUrl,
      type: messageData.type
    });
  } catch (error) {
    console.error('❌ Error sending file:', error.message);
    if (error.response) {
      console.error('LINE API Error:', error.response.status, error.response.data);
    }
    res.status(500).json({ 
      error: error.message || 'Failed to send file',
      details: error.response?.data || 'Unknown error'
    });
  }
});

// API endpoint to update LINE configuration
app.post('/api/config/update', (req, res) => {
  const { channelAccessToken, channelSecret, ngrokUrl } = req.body;
  
  console.log('📥 Received config update:', {
    hasToken: !!channelAccessToken,
    hasSecret: !!channelSecret,
    ngrokUrl: ngrokUrl || '(empty)'
  });
  
  if (!channelAccessToken || !channelSecret) {
    return res.status(400).json({ 
      success: false, 
      error: 'Channel Access Token and Channel Secret are required' 
    });
  }
  
  // Update configuration
  updateConfig({ channelAccessToken, channelSecret, ngrokUrl: ngrokUrl || '' });
  
  // Save to .env file
  const envPath = path.join(__dirname, '.env');
  const envContent = `LINE_CHANNEL_ACCESS_TOKEN=${channelAccessToken}\nLINE_CHANNEL_SECRET=${channelSecret}\nNGROK_URL=${ngrokUrl || ''}\nPORT=${PORT}\n`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Config saved - ngrok URL:', ngrokUrl || '(not set)');
    res.json({ 
      success: true, 
      message: '✅ Configuration saved successfully!' 
    });
  } catch (error) {
    console.error('❌ Failed to save config:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save configuration file' 
    });
  }
});

// Webhook endpoint
app.post('/webhook/line', async (req, res) => {
  console.log('Received webhook event:');
  // Log the full event body for debugging
  console.log(JSON.stringify(req.body, null, 2));

  try {
    // Process all events in the request body
    await Promise.all(req.body.events.map(handleEvent));
    // Send a 200 OK response to LINE
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error processing events:', err);
    // It's still important to send a 200 OK response to LINE
    // to prevent webhook retries, but log the error internally.
    res.status(200).send();
  }
});

/**
 * Downloads a file from LINE Content API
 */
async function downloadLineContent(messageId, fileExtension) {
  return new Promise((resolve, reject) => {
    const client = new Client(config);
    const stream = client.getMessageContent(messageId);
    
    const fileName = `${messageId}.${fileExtension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    const writeStream = fs.createWriteStream(filePath);

    stream.then(readable => {
      readable.pipe(writeStream);
      writeStream.on('finish', () => {
        resolve(`/uploads/${fileName}`);
      });
      writeStream.on('error', reject);
    }).catch(reject);
  });
}

/**
 * Handles a single webhook event from LINE.
 * @param {Object} event - The webhook event object.
 */
async function handleEvent(event) {
  // Handle different message types
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const messageType = event.message.type;
  const timestamp = event.timestamp;

  try {
    // Get user profile from LINE
    const client = new Client(config);
    let userProfile;
    try {
      userProfile = await client.getProfile(userId);
    } catch (error) {
      console.error('Error getting user profile:', error.message);
      userProfile = {
        displayName: 'Unknown User',
        userId: userId,
        pictureUrl: null
      };
    }

    // Store or update chat
    if (!chats.has(userId)) {
      chats.set(userId, {
        id: userId,
        userId: userId,
        name: userProfile.displayName,
        avatar: userProfile.pictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName)}&background=06C755&color=fff`,
        platform: 'line',
        online: true,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        isPinned: false,
        tags: []
      });
    }

    // Initialize messages array
    if (!messages.has(userId)) {
      messages.set(userId, []);
    }

    // Handle different message types
    let messageData = {
      id: event.message.id,
      sender: 'user',
      time: new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp,
      type: messageType
    };

    switch (messageType) {
      case 'text':
        messageData.text = event.message.text;
        console.log(`📝 Text message from ${userProfile.displayName}: ${event.message.text}`);
        break;

      case 'image':
        try {
          const imageUrl = await downloadLineContent(event.message.id, 'jpg');
          messageData.imageUrl = imageUrl;
          messageData.text = '📷 ส่งรูปภาพ';
          console.log(`📷 Image received from ${userProfile.displayName}, saved to ${imageUrl}`);
        } catch (error) {
          console.error('Error downloading image:', error);
          messageData.text = '📷 รูปภาพ (ดาวน์โหลดไม่สำเร็จ)';
        }
        break;

      case 'video':
        try {
          const videoUrl = await downloadLineContent(event.message.id, 'mp4');
          messageData.videoUrl = videoUrl;
          messageData.text = '🎥 ส่งวิดีโอ';
          console.log(`🎥 Video received from ${userProfile.displayName}, saved to ${videoUrl}`);
        } catch (error) {
          console.error('Error downloading video:', error);
          messageData.text = '🎥 วิดีโอ (ดาวน์โหลดไม่สำเร็จ)';
        }
        break;

      case 'audio':
        try {
          const audioUrl = await downloadLineContent(event.message.id, 'm4a');
          messageData.audioUrl = audioUrl;
          messageData.text = '🎵 ส่งเสียง';
          console.log(`🎵 Audio received from ${userProfile.displayName}, saved to ${audioUrl}`);
        } catch (error) {
          console.error('Error downloading audio:', error);
          messageData.text = '🎵 ไฟล์เสียง (ดาวน์โหลดไม่สำเร็จ)';
        }
        break;

      case 'file':
        try {
          const fileName = event.message.fileName || 'document';
          const fileExtension = fileName.split('.').pop() || 'bin';
          const fileUrl = await downloadLineContent(event.message.id, fileExtension);
          messageData.fileUrl = fileUrl;
          messageData.fileName = fileName;
          messageData.text = `📎 ส่งไฟล์: ${fileName}`;
          console.log(`📎 File received from ${userProfile.displayName}: ${fileName}`);
        } catch (error) {
          console.error('Error downloading file:', error);
          messageData.text = '📎 ไฟล์ (ดาวน์โหลดไม่สำเร็จ)';
        }
        break;

      case 'sticker':
        messageData.text = '😊 ส่งสติกเกอร์';
        messageData.stickerId = event.message.stickerId;
        messageData.packageId = event.message.packageId;
        console.log(`😊 Sticker from ${userProfile.displayName}`);
        break;

      case 'location':
        messageData.text = `📍 แชร์ตำแหน่ง: ${event.message.address || 'Unknown'}`;
        messageData.latitude = event.message.latitude;
        messageData.longitude = event.message.longitude;
        console.log(`📍 Location from ${userProfile.displayName}`);
        break;

      default:
        messageData.text = `ข้อความประเภท: ${messageType}`;
        console.log(`❓ Unknown message type: ${messageType}`);
    }

    // Store message
    messages.get(userId).push(messageData);

    // Save to file after receiving message
    saveData();

    console.log(`✅ Message stored from ${userProfile.displayName} - waiting for admin reply`);
  } catch (error) {
    console.error('Error in handleEvent:', error);
    throw error;
  }
}

// Helper to load settings
function loadSettings() {
  if (fs.existsSync(SETTINGS_FILE)) {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  }
  return { customerPriceLevel: 1 };
}

// Helper to save settings
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

// API: Get Settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = loadSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// API: Update Settings
app.post('/api/settings', (req, res) => {
  try {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...req.body };
    saveSettings(newSettings);
    res.json({ success: true, settings: newSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Helper functions for data files
function loadDataFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return defaultValue;
  }
}

function saveDataFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
}

// API: Online Bills
app.get('/api/bills', (req, res) => {
  try {
    const bills = loadDataFile(BILLS_FILE, []);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load bills' });
  }
});

app.post('/api/bills', (req, res) => {
  try {
    const bills = loadDataFile(BILLS_FILE, []);
    const newBill = req.body;
    if (newBill.id) {
      // Update existing bill
      const index = bills.findIndex(b => b.id === newBill.id);
      if (index !== -1) {
        bills[index] = { ...bills[index], ...newBill, updatedAt: new Date().toISOString() };
      } else {
        bills.push(newBill);
      }
    } else {
      // Create new bill
      newBill.id = `INV-${Date.now().toString().slice(-6)}`;
      newBill.createdAt = new Date().toISOString();
      newBill.updatedAt = new Date().toISOString();
      bills.push(newBill);
    }
    saveDataFile(BILLS_FILE, bills);
    res.json({ success: true, bill: newBill });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save bill' });
  }
});

app.put('/api/bills/:id', (req, res) => {
  try {
    const bills = loadDataFile(BILLS_FILE, []);
    const { id } = req.params;
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      bills[index] = { ...bills[index], ...req.body, updatedAt: new Date().toISOString() };
      saveDataFile(BILLS_FILE, bills);
      res.json({ success: true, bill: bills[index] });
    } else {
      res.status(404).json({ error: 'Bill not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

app.delete('/api/bills/:id', (req, res) => {
  try {
    const bills = loadDataFile(BILLS_FILE, []);
    const { id } = req.params;
    const filteredBills = bills.filter(b => b.id !== id);
    saveDataFile(BILLS_FILE, filteredBills);
    
    // Also delete from database if available
    if (db) {
      try {
        db.prepare('DELETE FROM online_bills WHERE id = ?').run(id);
      } catch (dbError) {
        console.error('Database delete error:', dbError);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Sync bills from localStorage to backend
app.post('/api/bills/sync', (req, res) => {
  try {
    const { bills: importedBills } = req.body;
    
    if (!importedBills || !Array.isArray(importedBills)) {
      return res.status(400).json({ error: 'Invalid bills data' });
    }
    
    // Load existing bills
    const existingBills = loadDataFile(BILLS_FILE, []);
    
    // Merge bills (update existing, add new)
    const billsMap = new Map();
    
    // Add existing bills to map
    existingBills.forEach(bill => {
      billsMap.set(bill.id, bill);
    });
    
    // Merge imported bills
    importedBills.forEach(bill => {
      if (bill.id) {
        const existing = billsMap.get(bill.id);
        if (existing) {
          // Update existing bill (keep newer data)
          billsMap.set(bill.id, {
            ...existing,
            ...bill,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Add new bill
          billsMap.set(bill.id, {
            ...bill,
            createdAt: bill.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    });
    
    // Convert map back to array
    const mergedBills = Array.from(billsMap.values());
    
    // Save to file
    saveDataFile(BILLS_FILE, mergedBills);
    
    // Sync to database if available
    if (db) {
      try {
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
        
        insertMany(mergedBills);
        console.log('✅ Synced bills to database');
      } catch (dbError) {
        console.error('Database sync error:', dbError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Bills synced successfully',
      count: mergedBills.length,
      imported: importedBills.length,
      existing: existingBills.length
    });
  } catch (error) {
    console.error('Sync bills error:', error);
    res.status(500).json({ error: 'Failed to sync bills' });
  }
});

// API: Shop Data
app.get('/api/shop-data', (req, res) => {
  try {
    const shopData = loadDataFile(SHOP_DATA_FILE, {
      shop_name: 'โรจน์พาณิชย์ โครงเหล็ก...',
      shop_logo: 'RP',
      product_card_size: 'medium',
      nav_categories_count: 5,
      bill_modal_size: 'medium',
      bill_font_size: 'small'
    });
    res.json(shopData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load shop data' });
  }
});

app.post('/api/shop-data', (req, res) => {
  try {
    const currentData = loadDataFile(SHOP_DATA_FILE, {});
    const newData = { ...currentData, ...req.body };
    saveDataFile(SHOP_DATA_FILE, newData);
    res.json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save shop data' });
  }
});

// API: Bank Accounts
app.get('/api/bank-accounts', (req, res) => {
  try {
    const accounts = loadDataFile(BANK_ACCOUNTS_FILE, []);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load bank accounts' });
  }
});

app.post('/api/bank-accounts', (req, res) => {
  try {
    const accounts = loadDataFile(BANK_ACCOUNTS_FILE, []);
    const newAccount = { ...req.body, id: req.body.id || Date.now().toString() };
    if (req.body.id) {
      // Update existing
      const index = accounts.findIndex(a => a.id === req.body.id);
      if (index !== -1) {
        accounts[index] = newAccount;
      } else {
        accounts.push(newAccount);
      }
    } else {
      accounts.push(newAccount);
    }
    saveDataFile(BANK_ACCOUNTS_FILE, accounts);
    res.json({ success: true, account: newAccount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save bank account' });
  }
});

app.delete('/api/bank-accounts/:id', (req, res) => {
  try {
    const accounts = loadDataFile(BANK_ACCOUNTS_FILE, []);
    const { id } = req.params;
    const filteredAccounts = accounts.filter(a => a.id !== id);
    saveDataFile(BANK_ACCOUNTS_FILE, filteredAccounts);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

// API: Shipping Companies
app.get('/api/shipping-companies', (req, res) => {
  try {
    const companies = loadDataFile(SHIPPING_COMPANIES_FILE, [
      { id: 'flash', name: 'Flash Express', price: 50, icon: '⚡' },
      { id: 'kerry', name: 'Kerry Express', price: 60, icon: '🚚' },
      { id: 'jt', name: 'J&T Express', price: 45, icon: '📦' },
      { id: 'thaipost', name: 'ไปรษณีย์ไทย', price: 40, icon: '📮' },
      { id: 'scg', name: 'SCG Express', price: 55, icon: '🏢' },
    ]);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load shipping companies' });
  }
});

app.post('/api/shipping-companies', (req, res) => {
  try {
    const companies = loadDataFile(SHIPPING_COMPANIES_FILE, []);
    const newCompany = { ...req.body, id: req.body.id || Date.now().toString() };
    if (req.body.id) {
      // Update existing
      const index = companies.findIndex(c => c.id === req.body.id);
      if (index !== -1) {
        companies[index] = newCompany;
      } else {
        companies.push(newCompany);
      }
    } else {
      companies.push(newCompany);
    }
    saveDataFile(SHIPPING_COMPANIES_FILE, companies);
    res.json({ success: true, company: newCompany });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save shipping company' });
  }
});

app.delete('/api/shipping-companies/:id', (req, res) => {
  try {
    const companies = loadDataFile(SHIPPING_COMPANIES_FILE, []);
    const { id } = req.params;
    const filteredCompanies = companies.filter(c => c.id !== id);
    saveDataFile(SHIPPING_COMPANIES_FILE, filteredCompanies);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shipping company' });
  }
});

// ============================================
// Chat History & Sync APIs (สำหรับเครื่องอื่น)
// ============================================

// Auto-backup to GitHub (via webhook or manual trigger)
// This endpoint can be called periodically to backup data
// Support both GET and POST
app.get('/api/backup/github', async (req, res) => {
  try {
    // Get all data
    const chatsData = {};
    chats.forEach((chat, userId) => {
      chatsData[userId] = chat;
    });
    
    const messagesData = {};
    messages.forEach((msgs, userId) => {
      messagesData[userId] = msgs;
    });
    
    // Save to JSON files first
    saveData();
    
    // Return data for manual GitHub commit
    // Save backup to file for auto-restore
    const backupData = {
      chats: Object.values(chatsData),
      messages: messagesData,
      timestamp: Date.now()
    };
    
    const backupFile = path.join(DATA_DIR, 'backup_data.json');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Data ready for GitHub backup',
      data: backupData,
      backupFile: backupFile,
      instructions: [
        '1. Download this JSON response',
        '2. Save as backup_data.json in line-webhook/data/',
        '3. Commit to GitHub repository',
        '4. After deploy, use /api/restore/auto to restore automatically'
      ]
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Also support POST method
app.post('/api/backup/github', async (req, res) => {
  // Redirect to GET handler
  return app._router.handle({ ...req, method: 'GET' }, res);
});

// Get all chat history (for cross-device access)
app.get('/api/chats/history/all', (req, res) => {
  try {
    const { limit, offset, fromTimestamp } = req.query;
    
    if (db) {
      // Get from database
      let query = 'SELECT * FROM messages';
      const params = [];
      
      if (fromTimestamp) {
        query += ' WHERE timestamp >= ?';
        params.push(parseInt(fromTimestamp));
      }
      
      query += ' ORDER BY timestamp ASC';
      
      if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
      }
      
      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
      
      const dbMessages = db.prepare(query).all(...params);
      
      // Group by user_id
      const messagesByUser = {};
      dbMessages.forEach(msg => {
        if (!messagesByUser[msg.user_id]) {
          messagesByUser[msg.user_id] = [];
        }
        messagesByUser[msg.user_id].push({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          type: msg.type,
          time: msg.time,
          timestamp: msg.timestamp,
          imageUrl: msg.image_url,
          videoUrl: msg.video_url,
          audioUrl: msg.audio_url,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          stickerId: msg.sticker_id,
          packageId: msg.package_id,
          latitude: msg.latitude,
          longitude: msg.longitude
        });
      });
      
      return res.json(messagesByUser);
    }
    
    // Fallback to memory
    const messagesObj = {};
    messages.forEach((msgs, userId) => {
      let filteredMsgs = msgs;
      if (fromTimestamp) {
        filteredMsgs = msgs.filter(msg => (msg.timestamp || 0) >= parseInt(fromTimestamp));
      }
      if (offset) {
        filteredMsgs = filteredMsgs.slice(parseInt(offset));
      }
      if (limit) {
        filteredMsgs = filteredMsgs.slice(0, parseInt(limit));
      }
      messagesObj[userId] = filteredMsgs;
    });
    
    res.json(messagesObj);
  } catch (error) {
    console.error('Error fetching all chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get all chats with full history (for cross-device sync)
app.get('/api/chats/sync/all', (req, res) => {
  try {
    const result = {
      chats: [],
      messages: {},
      timestamp: Date.now()
    };
    
    if (db) {
      // Get all chats from database
      const dbChats = db.prepare('SELECT * FROM chats ORDER BY updated_at DESC').all();
      result.chats = dbChats.map(chat => ({
        userId: chat.user_id,
        id: chat.user_id,
        name: chat.name,
        avatar: chat.avatar,
        platform: chat.platform,
        online: chat.online === 1,
        time: chat.time,
        unread: chat.unread,
        isPinned: chat.is_pinned === 1,
        tags: chat.tags ? JSON.parse(chat.tags) : []
      }));
      
      // Get all messages grouped by user_id
      const dbMessages = db.prepare('SELECT * FROM messages ORDER BY timestamp ASC').all();
      dbMessages.forEach(msg => {
        if (!result.messages[msg.user_id]) {
          result.messages[msg.user_id] = [];
        }
        result.messages[msg.user_id].push({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          type: msg.type,
          time: msg.time,
          timestamp: msg.timestamp,
          imageUrl: msg.image_url,
          videoUrl: msg.video_url,
          audioUrl: msg.audio_url,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          stickerId: msg.sticker_id,
          packageId: msg.package_id,
          latitude: msg.latitude,
          longitude: msg.longitude
        });
      });
    } else {
      // Fallback to memory
      result.chats = Array.from(chats.values());
      messages.forEach((msgs, userId) => {
        result.messages[userId] = msgs;
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error syncing all chats:', error);
    res.status(500).json({ error: 'Failed to sync chats' });
  }
});

// Import chat history (for cross-device sync)
app.post('/api/chats/sync/import', (req, res) => {
  try {
    const { chats: importedChats, messages: importedMessages } = req.body;
    
    if (!importedChats && !importedMessages) {
      return res.status(400).json({ error: 'No data to import' });
    }
    
    // Import chats
    if (importedChats && Array.isArray(importedChats)) {
      if (db) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO chats 
          (user_id, name, avatar, platform, online, time, unread, is_pinned, tags, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);
        
        const insertMany = db.transaction((chats) => {
          chats.forEach(chat => {
            stmt.run(
              chat.userId || chat.id,
              chat.name || '',
              chat.avatar || '',
              chat.platform || 'line',
              chat.online ? 1 : 0,
              chat.time || '',
              chat.unread || 0,
              chat.isPinned ? 1 : 0,
              JSON.stringify(chat.tags || [])
            );
          });
        });
        
        insertMany(importedChats);
      }
      
      // Also update memory
      importedChats.forEach(chat => {
        const userId = chat.userId || chat.id;
        chats.set(userId, chat);
      });
    }
    
    // Import messages
    if (importedMessages && typeof importedMessages === 'object') {
      if (db) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO messages 
          (id, user_id, text, sender, type, time, timestamp, image_url, video_url, 
           audio_url, file_url, file_name, sticker_id, package_id, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertMany = db.transaction((messagesObj) => {
          for (const [userId, msgs] of Object.entries(messagesObj)) {
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
        
        insertMany(importedMessages);
      }
      
      // Also update memory
      Object.entries(importedMessages).forEach(([userId, msgs]) => {
        messages.set(userId, msgs);
      });
    }
    
    // Save to JSON files
    saveData();
    
    res.json({ 
      success: true, 
      message: 'Chat history imported successfully',
      imported: {
        chats: importedChats?.length || 0,
        messages: Object.keys(importedMessages || {}).length
      }
    });
  } catch (error) {
    console.error('Error importing chat history:', error);
    res.status(500).json({ error: 'Failed to import chat history' });
  }
});

// Get chat statistics
app.get('/api/chats/stats', (req, res) => {
  try {
    let stats = {
      totalChats: 0,
      totalMessages: 0,
      totalUnread: 0,
      chatsByPlatform: {},
      messagesByType: {},
      oldestMessage: null,
      newestMessage: null
    };
    
    if (db) {
      stats.totalChats = db.prepare('SELECT COUNT(*) as count FROM chats').get().count;
      stats.totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
      stats.totalUnread = db.prepare('SELECT SUM(unread) as total FROM chats').get().total || 0;
      
      // Chats by platform
      const platformStats = db.prepare('SELECT platform, COUNT(*) as count FROM chats GROUP BY platform').all();
      platformStats.forEach(row => {
        stats.chatsByPlatform[row.platform] = row.count;
      });
      
      // Messages by type
      const typeStats = db.prepare('SELECT type, COUNT(*) as count FROM messages GROUP BY type').all();
      typeStats.forEach(row => {
        stats.messagesByType[row.type] = row.count;
      });
      
      // Oldest and newest message
      const oldest = db.prepare('SELECT MIN(timestamp) as timestamp FROM messages').get();
      const newest = db.prepare('SELECT MAX(timestamp) as timestamp FROM messages').get();
      stats.oldestMessage = oldest?.timestamp || null;
      stats.newestMessage = newest?.timestamp || null;
    } else {
      // Fallback to memory
      stats.totalChats = chats.size;
      let totalMsgs = 0;
      let totalUnread = 0;
      
      chats.forEach(chat => {
        totalUnread += chat.unread || 0;
        const platform = chat.platform || 'line';
        stats.chatsByPlatform[platform] = (stats.chatsByPlatform[platform] || 0) + 1;
      });
      
      messages.forEach(msgs => {
        totalMsgs += msgs.length;
        msgs.forEach(msg => {
          const type = msg.type || 'text';
          stats.messagesByType[type] = (stats.messagesByType[type] || 0) + 1;
        });
      });
      
      stats.totalMessages = totalMsgs;
      stats.totalUnread = totalUnread;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting chat stats:', error);
    res.status(500).json({ error: 'Failed to get chat statistics' });
  }
});

// ============================================
// Database Export/Import & Backup APIs
// ============================================

// Export database as SQLite file
app.get('/api/export/database', (req, res) => {
  try {
    const dbPath = getDatabasePath();
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="pos_chat_${Date.now()}.db"`);
    res.sendFile(dbPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Export all data as Excel
app.get('/api/export/excel', (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Export Chats
    if (db) {
      const chats = db.prepare('SELECT * FROM chats').all();
      if (chats.length > 0) {
        const chatsSheet = XLSX.utils.json_to_sheet(chats);
        XLSX.utils.book_append_sheet(workbook, chatsSheet, 'Chats');
      }
    } else {
      // Fallback to JSON
      if (fs.existsSync(CHATS_FILE)) {
        const chats = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
        const chatsArray = Object.entries(chats).map(([userId, chat]) => ({
          user_id: userId,
          ...chat
        }));
        if (chatsArray.length > 0) {
          const chatsSheet = XLSX.utils.json_to_sheet(chatsArray);
          XLSX.utils.book_append_sheet(workbook, chatsSheet, 'Chats');
        }
      }
    }
    
    // Export Messages
    if (db) {
      const messages = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC').all();
      if (messages.length > 0) {
        const messagesSheet = XLSX.utils.json_to_sheet(messages);
        XLSX.utils.book_append_sheet(workbook, messagesSheet, 'Messages');
      }
    } else {
      if (fs.existsSync(MESSAGES_FILE)) {
        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        const messagesArray = [];
        Object.entries(messages).forEach(([userId, msgs]) => {
          msgs.forEach(msg => {
            messagesArray.push({
              user_id: userId,
              ...msg
            });
          });
        });
        if (messagesArray.length > 0) {
          const messagesSheet = XLSX.utils.json_to_sheet(messagesArray);
          XLSX.utils.book_append_sheet(workbook, messagesSheet, 'Messages');
        }
      }
    }
    
    // Export Bills
    if (db) {
      const bills = db.prepare('SELECT * FROM online_bills ORDER BY created_at DESC').all();
      if (bills.length > 0) {
        // Parse items JSON
        const billsFormatted = bills.map(bill => ({
          ...bill,
          items: typeof bill.items === 'string' ? bill.items : JSON.stringify(bill.items)
        }));
        const billsSheet = XLSX.utils.json_to_sheet(billsFormatted);
        XLSX.utils.book_append_sheet(workbook, billsSheet, 'Bills');
      }
    } else {
      if (fs.existsSync(BILLS_FILE)) {
        const bills = JSON.parse(fs.readFileSync(BILLS_FILE, 'utf8'));
        if (bills.length > 0) {
          const billsSheet = XLSX.utils.json_to_sheet(bills);
          XLSX.utils.book_append_sheet(workbook, billsSheet, 'Bills');
        }
      }
    }
    
    // Export Bank Accounts
    if (db) {
      const bankAccounts = db.prepare('SELECT * FROM bank_accounts').all();
      if (bankAccounts.length > 0) {
        const bankSheet = XLSX.utils.json_to_sheet(bankAccounts);
        XLSX.utils.book_append_sheet(workbook, bankSheet, 'Bank Accounts');
      }
    } else {
      if (fs.existsSync(BANK_ACCOUNTS_FILE)) {
        const accounts = JSON.parse(fs.readFileSync(BANK_ACCOUNTS_FILE, 'utf8'));
        if (accounts.length > 0) {
          const bankSheet = XLSX.utils.json_to_sheet(accounts);
          XLSX.utils.book_append_sheet(workbook, bankSheet, 'Bank Accounts');
        }
      }
    }
    
    // Export Shipping Companies
    if (db) {
      const shippingCompanies = db.prepare('SELECT * FROM shipping_companies').all();
      if (shippingCompanies.length > 0) {
        const shippingSheet = XLSX.utils.json_to_sheet(shippingCompanies);
        XLSX.utils.book_append_sheet(workbook, shippingSheet, 'Shipping Companies');
      }
    } else {
      if (fs.existsSync(SHIPPING_COMPANIES_FILE)) {
        const companies = JSON.parse(fs.readFileSync(SHIPPING_COMPANIES_FILE, 'utf8'));
        if (companies.length > 0) {
          const shippingSheet = XLSX.utils.json_to_sheet(companies);
          XLSX.utils.book_append_sheet(workbook, shippingSheet, 'Shipping Companies');
        }
      }
    }
    
    // Export Settings
    if (db) {
      const settings = db.prepare('SELECT * FROM settings').all();
      if (settings.length > 0) {
        const settingsSheet = XLSX.utils.json_to_sheet(settings);
        XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');
      }
    } else {
      if (fs.existsSync(SETTINGS_FILE)) {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        const settingsArray = Object.entries(settings).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value)
        }));
        if (settingsArray.length > 0) {
          const settingsSheet = XLSX.utils.json_to_sheet(settingsArray);
          XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');
        }
      }
    }
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="pos_chat_export_${Date.now()}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Failed to export Excel file' });
  }
});

// Export all JSON files as ZIP
app.get('/api/export/json', (req, res) => {
  try {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="pos_chat_data_${Date.now()}.zip"`);
    
    archive.pipe(res);
    
    // Add all JSON files
    const jsonFiles = [
      'chats.json',
      'messages.json',
      'settings.json',
      'online_bills.json',
      'shop_data.json',
      'bank_accounts.json',
      'shipping_companies.json'
    ];
    
    jsonFiles.forEach(file => {
      const filePath = path.join(DATA_DIR, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });
    
    // Add database file if exists
    const dbPath = getDatabasePath();
    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'pos_chat.db' });
    }
    
    archive.finalize();
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to export JSON files' });
  }
});

// Backup all data (database + JSON + uploads)
app.get('/api/backup/all', (req, res) => {
  try {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="pos_chat_backup_${Date.now()}.zip"`);
    
    archive.pipe(res);
    
    // Add database
    const dbPath = getDatabasePath();
    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'database/pos_chat.db' });
    }
    
    // Add all JSON files
    const jsonFiles = [
      'chats.json',
      'messages.json',
      'settings.json',
      'online_bills.json',
      'shop_data.json',
      'bank_accounts.json',
      'shipping_companies.json'
    ];
    
    jsonFiles.forEach(file => {
      const filePath = path.join(DATA_DIR, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `data/${file}` });
      }
    });
    
    // Add uploads directory
    if (fs.existsSync(UPLOADS_DIR)) {
      const uploadFiles = fs.readdirSync(UPLOADS_DIR);
      uploadFiles.forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        if (fs.statSync(filePath).isFile()) {
          archive.file(filePath, { name: `uploads/${file}` });
        }
      });
    }
    
    archive.finalize();
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Get database info
app.get('/api/database/info', (req, res) => {
  try {
    if (!db) {
      return res.json({ 
        available: false, 
        message: 'Database not initialized',
        jsonFiles: {
          chats: fs.existsSync(CHATS_FILE),
          messages: fs.existsSync(MESSAGES_FILE),
          settings: fs.existsSync(SETTINGS_FILE),
          bills: fs.existsSync(BILLS_FILE),
          shopData: fs.existsSync(SHOP_DATA_FILE),
          bankAccounts: fs.existsSync(BANK_ACCOUNTS_FILE),
          shippingCompanies: fs.existsSync(SHIPPING_COMPANIES_FILE)
        }
      });
    }
    
    const stats = {
      chats: db.prepare('SELECT COUNT(*) as count FROM chats').get().count,
      messages: db.prepare('SELECT COUNT(*) as count FROM messages').get().count,
      bills: db.prepare('SELECT COUNT(*) as count FROM online_bills').get().count,
      bankAccounts: db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get().count,
      shippingCompanies: db.prepare('SELECT COUNT(*) as count FROM shipping_companies').get().count
    };
    
    const dbPath = getDatabasePath();
    const dbStats = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;
    
    res.json({
      available: true,
      path: dbPath,
      size: dbStats ? dbStats.size : 0,
      stats,
      jsonFiles: {
        chats: fs.existsSync(CHATS_FILE),
        messages: fs.existsSync(MESSAGES_FILE),
        settings: fs.existsSync(SETTINGS_FILE),
        bills: fs.existsSync(BILLS_FILE),
        shopData: fs.existsSync(SHOP_DATA_FILE),
        bankAccounts: fs.existsSync(BANK_ACCOUNTS_FILE),
        shippingCompanies: fs.existsSync(SHIPPING_COMPANIES_FILE)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database info' });
  }
});

// Auto-restore from backup (if backup file exists)
app.post('/api/restore/auto', async (req, res) => {
  try {
    // Check if backup file exists in data directory
    const backupFile = path.join(DATA_DIR, 'backup_data.json');
    
    if (!fs.existsSync(backupFile)) {
      return res.json({
        success: false,
        message: 'No backup file found. Please backup first.',
        backupFile: backupFile
      });
    }
    
    // Load backup data
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Import chats
    if (backupData.chats && Array.isArray(backupData.chats)) {
      if (db) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO chats 
          (user_id, name, avatar, platform, online, time, unread, is_pinned, tags, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);
        
        const insertMany = db.transaction((chats) => {
          chats.forEach(chat => {
            stmt.run(
              chat.userId || chat.id,
              chat.name || '',
              chat.avatar || '',
              chat.platform || 'line',
              chat.online ? 1 : 0,
              chat.time || '',
              chat.unread || 0,
              chat.isPinned ? 1 : 0,
              JSON.stringify(chat.tags || [])
            );
          });
        });
        
        insertMany(backupData.chats);
      }
      
      // Update memory
      backupData.chats.forEach(chat => {
        const userId = chat.userId || chat.id;
        chats.set(userId, chat);
      });
    }
    
    // Import messages
    if (backupData.messages && typeof backupData.messages === 'object') {
      if (db) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO messages 
          (id, user_id, text, sender, type, time, timestamp, image_url, video_url, 
           audio_url, file_url, file_name, sticker_id, package_id, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertMany = db.transaction((messagesObj) => {
          for (const [userId, msgs] of Object.entries(messagesObj)) {
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
        
        insertMany(backupData.messages);
      }
      
      // Update memory
      Object.entries(backupData.messages).forEach(([userId, msgs]) => {
        messages.set(userId, msgs);
      });
    }
    
    // Save to JSON files
    saveData();
    
    res.json({
      success: true,
      message: 'Data restored successfully',
      restored: {
        chats: backupData.chats?.length || 0,
        messages: Object.keys(backupData.messages || {}).length
      }
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore data', message: error.message });
  }
});

// Sync JSON to Database
app.post('/api/database/sync', (req, res) => {
  try {
    syncJsonToDatabase();
    res.json({ success: true, message: 'Data synced to database' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n✅ LINE webhook server is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. 🚀 Run ngrok to expose this port: ngrok http ${PORT}`);
  console.log(`2. 🌐 Copy the ngrok URL (e.g., https://xxxx.ngrok.io)`);
  console.log(`3. ⚙️  Configure in frontend Settings > LINE Official Account`);
  console.log(`4. 📝 Paste ngrok URL + /webhook/line into LINE Developers Console\n`);
  
  // Check if config is set
  if (!config.channelAccessToken || !config.channelSecret || 
      config.channelAccessToken === 'your_channel_access_token_here') {
    console.log(`⚠️  Configuration not found. Please set up LINE credentials via frontend.\n`);
  } else {
    console.log(`✅ LINE credentials loaded from .env file\n`);
  }
});
