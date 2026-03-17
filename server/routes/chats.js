const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  getOrCreateConversation,
  deleteMessageForMe,
  deleteMessageForEveryone
} = require('../controllers/chatController');

// GET /api/chats/conversations
router.get('/conversations', verifyToken, getConversations);

// GET /api/chats/:conversationId/messages
router.get('/:conversationId/messages', verifyToken, getMessages);

// POST /api/chats/conversation
router.post('/conversation', verifyToken, getOrCreateConversation);

// DELETE /api/chats/messages/:messageId/me
router.delete('/messages/:messageId/me', verifyToken, deleteMessageForMe);

// DELETE /api/chats/messages/:messageId/everyone
router.delete('/messages/:messageId/everyone', verifyToken, deleteMessageForEveryone);

module.exports = router;
