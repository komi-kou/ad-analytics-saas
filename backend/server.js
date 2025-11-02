// ============================================
// Multi-User Ad Analytics SaaS - Backend API
// ============================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

app.use(cors());
app.use(express.json());

// ============================================
// Database Connection
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// ============================================
// Helper Functions
// ============================================

// Simple encryption (use proper encryption in production)
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate unique ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================
// Authentication Middleware
// ============================================

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify token and get user
    const result = await pool.query(
      'SELECT * FROM users WHERE gomarble_token = $1 AND is_active = TRUE',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Auth Routes
// ============================================

// Register/Login with gomarble token
app.post('/api/auth/gomarble', async (req, res) => {
  const { email, gomarbleToken } = req.body;
  
  if (!email || !gomarbleToken) {
    return res.status(400).json({ error: 'Email and gomarbleToken are required' });
  }
  
  try {
    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      // Update existing user
      const userId = result.rows[0].id;
      await pool.query(
        'UPDATE users SET gomarble_token = $1, last_login = NOW() WHERE id = $2',
        [gomarbleToken, userId]
      );
      
      res.json({
        success: true,
        user: {
          id: userId,
          email: email,
          token: gomarbleToken
        }
      });
    } else {
      // Create new user
      const userId = generateId('user');
      await pool.query(
        'INSERT INTO users (id, email, gomarble_token, last_login) VALUES ($1, $2, $3, NOW())',
        [userId, email, gomarbleToken]
      );
      
      res.json({
        success: true,
        user: {
          id: userId,
          email: email,
          token: gomarbleToken
        }
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============================================
// Account Routes
// ============================================

// Get all accounts for user
app.get('/api/accounts', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        c.id as chatwork_id,
        c.room_id,
        c.enabled as chatwork_enabled,
        c.schedule,
        c.day_of_week,
        c.time,
        c.timezone
      FROM ad_accounts a
      LEFT JOIN chatwork_settings c ON a.id = c.account_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `, [req.user.id]);
    
    res.json({
      success: true,
      accounts: result.rows
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Add new account
app.post('/api/accounts', authenticateUser, async (req, res) => {
  const { platform, accountId, accountName, currency } = req.body;
  
  if (!platform || !accountId || !accountName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const newAccountId = generateId('account');
    
    await pool.query(`
      INSERT INTO ad_accounts (id, user_id, platform, account_id, account_name, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [newAccountId, req.user.id, platform, accountId, accountName, currency || 'JPY']);
    
    res.json({
      success: true,
      accountId: newAccountId
    });
  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ error: 'Failed to add account' });
  }
});

// Get account configuration
app.get('/api/accounts/:id/config', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verify account ownership
    const accountCheck = await pool.query(
      'SELECT * FROM ad_accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Get full configuration
    const result = await pool.query(`
      SELECT 
        a.*,
        c.*,
        m.*,
        al.*
      FROM ad_accounts a
      LEFT JOIN chatwork_settings c ON a.id = c.account_id
      LEFT JOIN metrics_config m ON a.id = m.account_id
      LEFT JOIN analysis_levels_config al ON a.id = al.account_id
      WHERE a.id = $1
    `, [id]);
    
    res.json({
      success: true,
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update account configuration
app.post('/api/accounts/:id/config', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { chatwork, metrics, analysisLevels } = req.body;
  
  try {
    // Verify account ownership
    const accountCheck = await pool.query(
      'SELECT * FROM ad_accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update or insert Chatwork settings
      if (chatwork) {
        const encryptedToken = encrypt(chatwork.apiToken);
        
        await client.query(`
          INSERT INTO chatwork_settings (id, account_id, room_id, api_token, enabled, schedule, day_of_week, time, timezone)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (account_id) 
          DO UPDATE SET 
            room_id = EXCLUDED.room_id,
            api_token = EXCLUDED.api_token,
            enabled = EXCLUDED.enabled,
            schedule = EXCLUDED.schedule,
            day_of_week = EXCLUDED.day_of_week,
            time = EXCLUDED.time,
            timezone = EXCLUDED.timezone,
            updated_at = NOW()
        `, [
          generateId('chatwork'),
          id,
          chatwork.roomId,
          encryptedToken,
          chatwork.enabled,
          chatwork.schedule,
          chatwork.dayOfWeek,
          chatwork.time,
          chatwork.timezone || 'Asia/Tokyo'
        ]);
      }
      
      // Update metrics config
      if (metrics) {
        const metricsFields = Object.keys(metrics).map(key => `${key} = $${Object.keys(metrics).indexOf(key) + 2}`).join(', ');
        const metricsValues = Object.values(metrics);
        
        await client.query(`
          UPDATE metrics_config SET ${metricsFields}, updated_at = NOW() WHERE account_id = $1
        `, [id, ...metricsValues]);
      }
      
      // Update analysis levels config
      if (analysisLevels) {
        const levelsFields = Object.keys(analysisLevels).map(key => `${key} = $${Object.keys(analysisLevels).indexOf(key) + 2}`).join(', ');
        const levelsValues = Object.values(analysisLevels);
        
        await client.query(`
          UPDATE analysis_levels_config SET ${levelsFields}, updated_at = NOW() WHERE account_id = $1
        `, [id, ...levelsValues]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Test Chatwork connection
app.post('/api/accounts/:id/test', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get account and Chatwork settings
    const result = await pool.query(`
      SELECT a.account_name, c.room_id, c.api_token
      FROM ad_accounts a
      JOIN chatwork_settings c ON a.id = c.account_id
      WHERE a.id = $1 AND a.user_id = $2
    `, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account or Chatwork settings not found' });
    }
    
    const { account_name, room_id, api_token } = result.rows[0];
    const decryptedToken = decrypt(api_token);
    
    // Send test message to Chatwork
    const chatworkResponse = await fetch(`https://api.chatwork.com/v2/rooms/${room_id}/messages`, {
      method: 'POST',
      headers: {
        'X-ChatWorkToken': decryptedToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `body=[Test] ${account_name}の広告分析システムからのテストメッセージです。\n設定は正常に動作しています✅`
    });
    
    if (!chatworkResponse.ok) {
      throw new Error('Chatwork API error');
    }
    
    res.json({
      success: true,
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Test send error:', error);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

// ============================================
// Analysis History Routes
// ============================================

// Get analysis history
app.get('/api/analysis/history', authenticateUser, async (req, res) => {
  const { accountId, limit = 10 } = req.query;
  
  try {
    let query = `
      SELECT 
        h.*,
        a.account_name,
        a.platform
      FROM analysis_history h
      JOIN ad_accounts a ON h.account_id = a.id
      WHERE a.user_id = $1
    `;
    const params = [req.user.id];
    
    if (accountId) {
      query += ' AND h.account_id = $2';
      params.push(accountId);
    }
    
    query += ' ORDER BY h.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

// Get single analysis detail
app.get('/api/analysis/history/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        h.*,
        a.account_name,
        a.platform
      FROM analysis_history h
      JOIN ad_accounts a ON h.account_id = a.id
      WHERE h.id = $1 AND a.user_id = $2
    `, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json({
      success: true,
      analysis: result.rows[0]
    });
  } catch (error) {
    console.error('Get analysis detail error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis detail' });
  }
});

// ============================================
// System Logs Routes (Admin)
// ============================================

app.get('/api/logs', authenticateUser, async (req, res) => {
  const { level, component, limit = 50 } = req.query;
  
  try {
    let query = 'SELECT * FROM system_logs WHERE 1=1';
    const params = [];
    
    if (level) {
      params.push(level);
      query += ` AND log_level = $${params.length}`;
    }
    
    if (component) {
      params.push(component);
      query += ` AND component = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      logs: result.rows
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ============================================
// Start Server
// ============================================

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
