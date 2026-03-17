const { getDb } = require('../database/init');

const uploadAvatar = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filename = req.file.filename;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(filename, userId);

    const user = db.prepare('SELECT id, phone, name, about, avatar, is_online, last_seen FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      filename,
      user
    });
  } catch (error) {
    console.error('UploadAvatar error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

module.exports = { uploadAvatar };
