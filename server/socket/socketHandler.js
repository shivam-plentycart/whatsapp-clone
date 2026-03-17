const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

// Map userId -> Set of socket IDs
const userSockets = new Map();

function getUserSocketIds(userId) {
  return userSockets.get(String(userId)) || new Set();
}

function addUserSocket(userId, socketId) {
  const key = String(userId);
  if (!userSockets.has(key)) userSockets.set(key, new Set());
  userSockets.get(key).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const key = String(userId);
  if (userSockets.has(key)) {
    userSockets.get(key).delete(socketId);
    if (userSockets.get(key).size === 0) userSockets.delete(key);
  }
}

function isUserOnline(userId) {
  const sockets = getUserSocketIds(userId);
  return sockets.size > 0;
}

function initializeSocket(io) {
  // Auth middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userPhone = decoded.phone;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected (socket: ${socket.id})`);

    const db = getDb();

    // Register socket
    addUserSocket(userId, socket.id);

    // Update user online status
    db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

    // Update socket_id in sessions
    db.prepare('UPDATE user_sessions SET socket_id = ? WHERE user_id = ? AND is_active = 1').run(socket.id, userId);

    // Notify contacts that user is online
    broadcastUserStatus(io, db, userId, true);

    // ─── SEND MESSAGE ────────────────────────────────────────────────────────
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, receiverId, content, messageType = 'text', replyToId } = data;

        if (!conversationId || !receiverId || !content) {
          if (callback) callback({ success: false, message: 'Missing required fields' });
          return;
        }

        // Verify conversation exists and user is part of it
        const conversation = db.prepare(`
          SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)
        `).get(conversationId, userId, userId);

        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        // Check if receiver is online for delivery status
        const receiverOnline = isUserOnline(receiverId);
        const status = receiverOnline ? 'delivered' : 'sent';

        // Insert message
        const result = db.prepare(`
          INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, status, reply_to_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(conversationId, userId, receiverId, content.trim(), messageType, status, replyToId || null);

        const messageId = result.lastInsertRowid;

        // Update conversation last_message_id
        db.prepare(`
          UPDATE conversations SET last_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(messageId, conversationId);

        // Fetch full message with reply info
        const message = db.prepare(`
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
          WHERE m.id = ?
        `).get(messageId);

        // Send to sender (all their sockets)
        getUserSocketIds(userId).forEach(sid => {
          io.to(sid).emit('message_sent', { message, conversationId });
        });

        // Send to receiver (all their sockets)
        getUserSocketIds(receiverId).forEach(sid => {
          io.to(sid).emit('new_message', { message, conversationId });
        });

        // If receiver is online, immediately mark as delivered
        if (receiverOnline) {
          getUserSocketIds(userId).forEach(sid => {
            io.to(sid).emit('message_status_update', {
              messageId,
              conversationId,
              status: 'delivered'
            });
          });
        }

        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error('send_message error:', error);
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ─── MARK MESSAGES AS READ ───────────────────────────────────────────────
    socket.on('mark_read', ({ conversationId, senderId }) => {
      try {
        if (!conversationId || !senderId) return;

        // Mark all messages from sender in this conversation as read
        const result = db.prepare(`
          UPDATE messages SET status = 'read'
          WHERE conversation_id = ? AND sender_id = ? AND receiver_id = ? AND status != 'read'
        `).run(conversationId, senderId, userId);

        if (result.changes > 0) {
          // Notify the sender that messages were read
          getUserSocketIds(senderId).forEach(sid => {
            io.to(sid).emit('messages_read', {
              conversationId,
              readBy: userId
            });
          });
        }
      } catch (error) {
        console.error('mark_read error:', error);
      }
    });

    // ─── TYPING INDICATOR ────────────────────────────────────────────────────
    socket.on('typing_start', ({ conversationId, receiverId }) => {
      getUserSocketIds(receiverId).forEach(sid => {
        io.to(sid).emit('user_typing', {
          conversationId,
          userId,
          isTyping: true
        });
      });
    });

    socket.on('typing_stop', ({ conversationId, receiverId }) => {
      getUserSocketIds(receiverId).forEach(sid => {
        io.to(sid).emit('user_typing', {
          conversationId,
          userId,
          isTyping: false
        });
      });
    });

    // ─── DELETE MESSAGE ───────────────────────────────────────────────────────
    socket.on('delete_message', ({ messageId, conversationId, deleteForEveryone }) => {
      try {
        const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
        if (!message) return;

        if (deleteForEveryone && message.sender_id === userId) {
          db.prepare(`
            UPDATE messages SET is_deleted_for_everyone = 1, content = 'This message was deleted'
            WHERE id = ?
          `).run(messageId);

          // Update last message in conversation if this was the last message
          const lastMsg = db.prepare('SELECT * FROM conversations WHERE id = ? AND last_message_id = ?').get(conversationId, messageId);
          if (lastMsg) {
            db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
          }

          // Notify both parties
          [userId, message.receiver_id].forEach(uid => {
            getUserSocketIds(uid).forEach(sid => {
              io.to(sid).emit('message_deleted', {
                messageId,
                conversationId,
                forEveryone: true
              });
            });
          });
        } else {
          // Delete for me only (soft delete)
          db.prepare('UPDATE messages SET is_deleted = 1 WHERE id = ? AND sender_id = ?').run(messageId, userId);
          getUserSocketIds(userId).forEach(sid => {
            io.to(sid).emit('message_deleted', {
              messageId,
              conversationId,
              forEveryone: false
            });
          });
        }
      } catch (error) {
        console.error('delete_message error:', error);
      }
    });

    // ─── GET ONLINE STATUS ────────────────────────────────────────────────────
    socket.on('check_online_status', ({ userIds }) => {
      const statuses = {};
      userIds.forEach(uid => {
        statuses[uid] = isUserOnline(uid);
      });
      socket.emit('online_statuses', statuses);
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected (socket: ${socket.id})`);
      removeUserSocket(userId, socket.id);

      if (!isUserOnline(userId)) {
        const now = new Date().toISOString();
        db.prepare('UPDATE users SET is_online = 0, last_seen = ? WHERE id = ?').run(now, userId);
        broadcastUserStatus(io, db, userId, false, now);
      }
    });
  });
}

function broadcastUserStatus(io, db, userId, isOnline, lastSeen = null) {
  // Find all users that have conversations with this user
  const contacts = db.prepare(`
    SELECT DISTINCT
      CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END as contact_id
    FROM conversations
    WHERE user1_id = ? OR user2_id = ?
  `).all(userId, userId, userId);

  const statusData = {
    userId,
    isOnline,
    lastSeen: lastSeen || new Date().toISOString()
  };

  contacts.forEach(({ contact_id }) => {
    getUserSocketIds(contact_id).forEach(sid => {
      io.to(sid).emit('user_status_change', statusData);
    });
  });
}

module.exports = { initializeSocket, isUserOnline, getUserSocketIds };
