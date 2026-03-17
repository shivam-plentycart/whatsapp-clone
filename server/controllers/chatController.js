const { getDb } = require('../database/init');

// Get all conversations for current user
const getConversations = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;

    const conversations = db.prepare(`
      SELECT
        c.id,
        c.created_at,
        c.updated_at,
        CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
        u.name as other_user_name,
        u.phone as other_user_phone,
        u.avatar as other_user_avatar,
        u.is_online as other_user_online,
        u.last_seen as other_user_last_seen,
        u.about as other_user_about,
        m.content as last_message,
        m.message_type as last_message_type,
        m.sender_id as last_message_sender_id,
        m.status as last_message_status,
        m.created_at as last_message_time,
        m.is_deleted_for_everyone as last_message_deleted,
        (
          SELECT COUNT(*) FROM messages
          WHERE conversation_id = c.id
          AND sender_id != ?
          AND status != 'read'
          AND is_deleted = 0
        ) as unread_count
      FROM conversations c
      JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
      LEFT JOIN messages m ON m.id = c.last_message_id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY COALESCE(m.created_at, c.updated_at) DESC
    `).all(userId, userId, userId, userId, userId);

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('GetConversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// Get messages for a conversation
const getMessages = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of this conversation
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `).get(conversationId, userId, userId);

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get messages
    const messages = db.prepare(`
      SELECT
        m.*,
        u.name as sender_name,
        u.avatar as sender_avatar,
        rm.content as reply_content,
        rm.sender_id as reply_sender_id,
        ru.name as reply_sender_name,
        rm.message_type as reply_message_type,
        rm.is_deleted_for_everyone as reply_deleted
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN messages rm ON rm.id = m.reply_to_id
      LEFT JOIN users ru ON ru.id = rm.sender_id
      WHERE m.conversation_id = ?
      AND (m.is_deleted = 0 OR m.sender_id = ? OR m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(conversationId, userId, userId, parseInt(limit), parseInt(offset));

    // Mark messages as read
    db.prepare(`
      UPDATE messages SET status = 'read'
      WHERE conversation_id = ? AND receiver_id = ? AND status != 'read'
    `).run(conversationId, userId);

    // Get total count
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM messages
      WHERE conversation_id = ?
      AND (is_deleted = 0 OR sender_id = ? OR receiver_id = ?)
    `).get(conversationId, userId, userId);

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        hasMore: offset + messages.length < total.count
      }
    });
  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Create or get conversation between two users
const getOrCreateConversation = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'otherUserId is required' });
    }

    // Check if other user exists
    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find existing conversation
    let conversation = db.prepare(`
      SELECT * FROM conversations
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(userId, otherUserId, otherUserId, userId);

    // Create if doesn't exist
    if (!conversation) {
      const result = db.prepare(`
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (?, ?)
      `).run(userId, otherUserId);

      conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({
      success: true,
      conversation: {
        ...conversation,
        other_user_id: otherUser.id,
        other_user_name: otherUser.name,
        other_user_phone: otherUser.phone,
        other_user_avatar: otherUser.avatar,
        other_user_online: otherUser.is_online,
        other_user_last_seen: otherUser.last_seen,
        other_user_about: otherUser.about
      }
    });
  } catch (error) {
    console.error('GetOrCreateConversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

// Delete message for me
const deleteMessageForMe = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { messageId } = req.params;

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender_id !== userId && message.receiver_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Mark as deleted for this user (soft delete — in real app you'd have a deleted_for table)
    db.prepare('UPDATE messages SET is_deleted = 1 WHERE id = ? AND sender_id = ?').run(messageId, userId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('DeleteMessage error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

// Delete message for everyone
const deleteMessageForEveryone = (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { messageId } = req.params;

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages for everyone' });
    }

    db.prepare('UPDATE messages SET is_deleted_for_everyone = 1, content = "This message was deleted" WHERE id = ?').run(messageId);

    res.json({ success: true, message: 'Message deleted for everyone' });
  } catch (error) {
    console.error('DeleteMessageForEveryone error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  getOrCreateConversation,
  deleteMessageForMe,
  deleteMessageForEveryone
};
