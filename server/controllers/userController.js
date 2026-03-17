const { getDb } = require('../database/init');

// Search users by name or phone
const searchUsers = (req, res) => {
  try {
    const db = getDb();
    const { query } = req.query;
    const currentUserId = req.userId;

    if (!query || query.trim().length < 1) {
      return res.json({ success: true, users: [] });
    }

    const searchTerm = `%${query.trim()}%`;
    const users = db.prepare(`
      SELECT id, phone, name, about, avatar, is_online, last_seen
      FROM users
      WHERE id != ? AND (name LIKE ? OR phone LIKE ?)
      LIMIT 20
    `).all(currentUserId, searchTerm, searchTerm);

    res.json({ success: true, users });
  } catch (error) {
    console.error('SearchUsers error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// Get user profile by ID
const getUserById = (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const user = db.prepare(`
      SELECT id, phone, name, about, avatar, is_online, last_seen
      FROM users WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// Update user profile
const updateProfile = (req, res) => {
  try {
    const db = getDb();
    const { name, about } = req.body;
    const userId = req.userId;

    const updates = [];
    const values = [];

    if (name !== undefined && name.trim()) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (about !== undefined) {
      updates.push('about = ?');
      values.push(about.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedUser = db.prepare(`
      SELECT id, phone, name, about, avatar, is_online, last_seen
      FROM users WHERE id = ?
    `).get(userId);

    res.json({ success: true, message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Update avatar
const updateAvatar = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatar = req.file.filename;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, userId);

    const updatedUser = db.prepare(`
      SELECT id, phone, name, about, avatar, is_online, last_seen
      FROM users WHERE id = ?
    `).get(userId);

    res.json({ success: true, message: 'Avatar updated', user: updatedUser });
  } catch (error) {
    console.error('UpdateAvatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to update avatar' });
  }
};

module.exports = { searchUsers, getUserById, updateProfile, updateAvatar };
