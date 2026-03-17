const { getDb } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

// POST /api/invites — create or return existing active invite
const createInvite = (req, res) => {
  const db = getDb();
  const creatorId = req.user.id;

  // Reuse existing active invite if any
  const existing = db.prepare(`
    SELECT token FROM invite_links
    WHERE creator_id = ? AND used_by IS NULL AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC LIMIT 1
  `).get(creatorId);

  if (existing) {
    return res.json({ success: true, token: existing.token });
  }

  const token = uuidv4().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO invite_links (token, creator_id, expires_at) VALUES (?, ?, ?)
  `).run(token, creatorId, expiresAt);

  return res.json({ success: true, token });
};

// GET /api/invites/:token — public, returns creator info
const getInviteInfo = (req, res) => {
  const db = getDb();
  const { token } = req.params;

  const invite = db.prepare(`
    SELECT il.token, il.expires_at, il.used_by,
           u.id as creator_id, u.name as creator_name,
           u.avatar as creator_avatar, u.about as creator_about
    FROM invite_links il
    JOIN users u ON u.id = il.creator_id
    WHERE il.token = ?
  `).get(token);

  if (!invite) {
    return res.status(404).json({ success: false, message: 'Invite link not found' });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ success: false, message: 'This invite link has expired' });
  }

  return res.json({
    success: true,
    invite: {
      token: invite.token,
      creatorId: invite.creator_id,
      creatorName: invite.creator_name,
      creatorAvatar: invite.creator_avatar,
      creatorAbout: invite.creator_about,
      expiresAt: invite.expires_at,
      isUsed: !!invite.used_by
    }
  });
};

// POST /api/invites/:token/accept — auth required, creates conversation
const acceptInvite = (req, res) => {
  const db = getDb();
  const { token } = req.params;
  const userId = req.user.id;

  const invite = db.prepare(`SELECT * FROM invite_links WHERE token = ?`).get(token);

  if (!invite) {
    return res.status(404).json({ success: false, message: 'Invite link not found' });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ success: false, message: 'This invite link has expired' });
  }

  if (invite.creator_id === userId) {
    return res.status(400).json({ success: false, message: 'You cannot accept your own invite' });
  }

  // Get or create conversation
  const existing = db.prepare(`
    SELECT * FROM conversations
    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
  `).get(invite.creator_id, userId, userId, invite.creator_id);

  let conversationId;
  if (existing) {
    conversationId = existing.id;
  } else {
    const result = db.prepare(`
      INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)
    `).run(invite.creator_id, userId);
    conversationId = result.lastInsertRowid;
  }

  // Mark invite as used
  db.prepare(`UPDATE invite_links SET used_by = ? WHERE token = ?`).run(userId, token);

  // Return full conversation with other user info
  const conversation = db.prepare(`
    SELECT
      c.*,
      u.id as other_user_id,
      u.name as other_user_name,
      u.avatar as other_user_avatar,
      u.about as other_user_about,
      u.is_online as other_user_online,
      u.last_seen as other_user_last_seen
    FROM conversations c
    JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
    WHERE c.id = ?
  `).get(userId, conversationId);

  return res.json({ success: true, conversation });
};

module.exports = { createInvite, getInviteInfo, acceptInvite };
