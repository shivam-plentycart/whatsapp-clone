const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register new user
const register = (req, res) => {
  try {
    const db = getDb();
    const { phone, name, about } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ success: false, message: 'Phone and name are required' });
    }

    // Check if phone already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    // Handle avatar
    const avatar = req.file ? req.file.filename : 'default-avatar.png';

    // Insert new user
    const stmt = db.prepare(`
      INSERT INTO users (phone, name, about, avatar)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      phone.trim(),
      name.trim(),
      about || 'Hey there! I am using WhatsApp',
      avatar
    );

    const newUser = db.prepare('SELECT id, phone, name, about, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Auto-generate OTP for new registration
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate old OTPs
    db.prepare('UPDATE otp_codes SET is_used = 1 WHERE phone = ?').run(phone);

    // Insert new OTP
    db.prepare(`
      INSERT INTO otp_codes (phone, otp_code, expires_at)
      VALUES (?, ?, ?)
    `).run(phone, otp, expiresAt);

    console.log(`\n📱 OTP for ${phone}: ${otp} (expires in 5 minutes)\n`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. OTP sent to phone.',
      user: newUser,
      // For demo purposes only — remove in production
      demo_otp: otp
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// Send OTP
const sendOTP = (req, res) => {
  try {
    const db = getDb();
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Check user exists
    const user = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Phone number not registered. Please register first.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate old OTPs
    db.prepare('UPDATE otp_codes SET is_used = 1 WHERE phone = ?').run(phone);

    // Store new OTP
    db.prepare(`
      INSERT INTO otp_codes (phone, otp_code, expires_at)
      VALUES (?, ?, ?)
    `).run(phone, otp, expiresAt);

    console.log(`\n📱 OTP for ${phone}: ${otp} (expires in 5 minutes)\n`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // For demo only — remove in production
      demo_otp: otp
    });
  } catch (error) {
    console.error('SendOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify OTP and login
const verifyOTP = (req, res) => {
  try {
    const db = getDb();
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    // Get latest unused OTP
    const otpRecord = db.prepare(`
      SELECT * FROM otp_codes
      WHERE phone = ? AND otp_code = ? AND is_used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, otp);

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as used
    db.prepare('UPDATE otp_codes SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    // Get user
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user online status
    db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store session
    db.prepare(`
      INSERT INTO user_sessions (user_id, token, is_active)
      VALUES (?, ?, 1)
    `).run(user.id, token);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        is_online: 1,
        last_seen: user.last_seen
      }
    });
  } catch (error) {
    console.error('VerifyOTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Logout
const logout = (req, res) => {
  try {
    const db = getDb();
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      db.prepare('UPDATE user_sessions SET is_active = 0 WHERE token = ?').run(token);
    }

    // Set user offline
    if (req.userId) {
      db.prepare('UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(req.userId);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Get current user
const getMe = (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, phone, name, about, avatar, is_online, last_seen FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

module.exports = { register, sendOTP, verifyOTP, logout, getMe };
