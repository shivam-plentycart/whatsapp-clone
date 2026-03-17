import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { chatsAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext(null);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {},          // { [conversationId]: [message, ...] }
  typingUsers: {},       // { [conversationId]: { userId, isTyping } }
  onlineUsers: {},       // { [userId]: boolean }
  isLoadingConversations: false,
  isLoadingMessages: false,
  unreadCounts: {},      // { [conversationId]: number }
  pagination: {},        // { [conversationId]: { page, hasMore } }
  replyTo: null,         // message being replied to
  error: null
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING_CONVERSATIONS':
      return { ...state, isLoadingConversations: action.payload };

    case 'SET_LOADING_MESSAGES':
      return { ...state, isLoadingMessages: action.payload };

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
        unreadCounts: action.payload.reduce((acc, c) => {
          acc[c.id] = c.unread_count || 0;
          return acc;
        }, {})
      };

    case 'ADD_OR_UPDATE_CONVERSATION': {
      const exists = state.conversations.find(c => c.id === action.payload.id);
      if (exists) {
        return {
          ...state,
          conversations: state.conversations.map(c =>
            c.id === action.payload.id ? { ...c, ...action.payload } : c
          ).sort((a, b) => new Date(b.last_message_time || b.updated_at) - new Date(a.last_message_time || a.updated_at))
        };
      }
      return {
        ...state,
        conversations: [action.payload, ...state.conversations]
      };
    }

    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload,
        replyTo: null
      };

    case 'SET_MESSAGES': {
      const { conversationId, messages, page, hasMore } = action.payload;
      const existing = state.messages[conversationId] || [];
      const allMessages = page === 1 ? messages : [...messages, ...existing];
      return {
        ...state,
        messages: { ...state.messages, [conversationId]: allMessages },
        pagination: {
          ...state.pagination,
          [conversationId]: { page, hasMore }
        }
      };
    }

    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload;
      const existing = state.messages[conversationId] || [];
      const alreadyExists = existing.some(m => m.id === message.id);
      if (alreadyExists) {
        return {
          ...state,
          messages: {
            ...state.messages,
            [conversationId]: existing.map(m => m.id === message.id ? message : m)
          }
        };
      }
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message]
        }
      };
    }

    case 'UPDATE_MESSAGE_STATUS': {
      const { conversationId, messageId, status } = action.payload;
      const msgs = state.messages[conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: msgs.map(m => m.id === messageId ? { ...m, status } : m)
        }
      };
    }

    case 'UPDATE_ALL_MESSAGES_STATUS': {
      const { conversationId, status } = action.payload;
      const msgs = state.messages[conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: msgs.map(m => ({ ...m, status }))
        }
      };
    }

    case 'DELETE_MESSAGE': {
      const { conversationId, messageId, forEveryone } = action.payload;
      const msgs = state.messages[conversationId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: msgs.map(m => {
            if (m.id === messageId) {
              if (forEveryone) return { ...m, is_deleted_for_everyone: 1, content: 'This message was deleted' };
              return { ...m, is_deleted: 1 };
            }
            return m;
          })
        }
      };
    }

    case 'SET_TYPING': {
      const { conversationId, userId, isTyping } = action.payload;
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: { userId, isTyping }
        }
      };
    }

    case 'SET_USER_ONLINE': {
      const { userId, isOnline, lastSeen } = action.payload;
      const updatedConvs = state.conversations.map(c => {
        if (c.other_user_id === userId) {
          return { ...c, other_user_online: isOnline ? 1 : 0, other_user_last_seen: lastSeen || c.other_user_last_seen };
        }
        return c;
      });
      const updatedActive = state.activeConversation?.other_user_id === userId
        ? { ...state.activeConversation, other_user_online: isOnline ? 1 : 0, other_user_last_seen: lastSeen }
        : state.activeConversation;
      return {
        ...state,
        conversations: updatedConvs,
        activeConversation: updatedActive,
        onlineUsers: { ...state.onlineUsers, [userId]: isOnline }
      };
    }

    case 'SET_UNREAD': {
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.payload.conversationId]: action.payload.count }
      };
    }

    case 'INCREMENT_UNREAD': {
      const current = state.unreadCounts[action.payload] || 0;
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.payload]: current + 1 }
      };
    }

    case 'CLEAR_UNREAD':
      return {
        ...state,
        unreadCounts: { ...state.unreadCounts, [action.payload]: 0 }
      };

    case 'SET_REPLY_TO':
      return { ...state, replyTo: action.payload };

    case 'CLEAR_REPLY':
      return { ...state, replyTo: null };

    case 'UPDATE_CONVERSATION_LAST_MSG': {
      const { conversationId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations
          .map(c => c.id === conversationId
            ? {
                ...c,
                last_message: message.is_deleted_for_everyone ? 'This message was deleted' : message.content,
                last_message_time: message.created_at,
                last_message_sender_id: message.sender_id,
                last_message_status: message.status,
                last_message_type: message.message_type
              }
            : c
          )
          .sort((a, b) => new Date(b.last_message_time || b.updated_at) - new Date(a.last_message_time || a.updated_at))
      };
    }

    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { on, off, emit } = useSocket();
  const typingTimeoutRef = useRef({});

  // Load conversations on mount
  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = ({ message, conversationId }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message } });
      dispatch({ type: 'UPDATE_CONVERSATION_LAST_MSG', payload: { conversationId, message } });

      // If not in this conversation, increment unread
      if (message.sender_id !== user?.id) {
        dispatch({ type: 'INCREMENT_UNREAD', payload: conversationId });
      }
    };

    const handleMessageSent = ({ message, conversationId }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message } });
      dispatch({ type: 'UPDATE_CONVERSATION_LAST_MSG', payload: { conversationId, message } });
    };

    const handleStatusUpdate = ({ messageId, conversationId, status }) => {
      dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { conversationId, messageId, status } });
    };

    const handleMessagesRead = ({ conversationId }) => {
      const msgs = state.messages[conversationId] || [];
      msgs.forEach(m => {
        if (m.sender_id === user?.id && m.status !== 'read') {
          dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { conversationId, messageId: m.id, status: 'read' } });
        }
      });
    };

    const handleUserTyping = ({ conversationId, userId, isTyping }) => {
      if (userId !== user?.id) {
        dispatch({ type: 'SET_TYPING', payload: { conversationId, userId, isTyping } });

        // Auto-clear typing after 3s
        if (isTyping) {
          if (typingTimeoutRef.current[conversationId]) {
            clearTimeout(typingTimeoutRef.current[conversationId]);
          }
          typingTimeoutRef.current[conversationId] = setTimeout(() => {
            dispatch({ type: 'SET_TYPING', payload: { conversationId, userId, isTyping: false } });
          }, 3000);
        }
      }
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      dispatch({ type: 'SET_USER_ONLINE', payload: { userId, isOnline, lastSeen } });
    };

    const handleMessageDeleted = ({ messageId, conversationId, forEveryone }) => {
      dispatch({ type: 'DELETE_MESSAGE', payload: { conversationId, messageId, forEveryone } });
    };

    on('new_message', handleNewMessage);
    on('message_sent', handleMessageSent);
    on('message_status_update', handleStatusUpdate);
    on('messages_read', handleMessagesRead);
    on('user_typing', handleUserTyping);
    on('user_status_change', handleUserStatus);
    on('message_deleted', handleMessageDeleted);

    return () => {
      off('new_message', handleNewMessage);
      off('message_sent', handleMessageSent);
      off('message_status_update', handleStatusUpdate);
      off('messages_read', handleMessagesRead);
      off('user_typing', handleUserTyping);
      off('user_status_change', handleUserStatus);
      off('message_deleted', handleMessageDeleted);
    };
  }, [on, off, user?.id, state.messages]);

  const loadConversations = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: true });
    try {
      const data = await chatsAPI.getConversations();
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations });
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: false });
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, page = 1) => {
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: true });
    try {
      const data = await chatsAPI.getMessages(conversationId, page);
      dispatch({
        type: 'SET_MESSAGES',
        payload: {
          conversationId,
          messages: data.messages,
          page,
          hasMore: data.pagination.hasMore
        }
      });
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false });
    }
  }, []);

  const setActiveConversation = useCallback(async (conversation) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation });

    if (conversation) {
      dispatch({ type: 'CLEAR_UNREAD', payload: conversation.id });

      // Load messages if not loaded
      if (!state.messages[conversation.id]) {
        await loadMessages(conversation.id);
      }

      // Mark messages as read
      if (conversation.other_user_id) {
        emit('mark_read', {
          conversationId: conversation.id,
          senderId: conversation.other_user_id
        });
      }
    }
  }, [state.messages, loadMessages, emit]);

  const sendMessage = useCallback((conversationId, receiverId, content, replyToId = null) => {
    return new Promise((resolve, reject) => {
      emit('send_message', {
        conversationId,
        receiverId,
        content,
        messageType: 'text',
        replyToId
      }, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.message || 'Failed to send message'));
        }
      });
    });
  }, [emit]);

  const startTyping = useCallback((conversationId, receiverId) => {
    emit('typing_start', { conversationId, receiverId });
  }, [emit]);

  const stopTyping = useCallback((conversationId, receiverId) => {
    emit('typing_stop', { conversationId, receiverId });
  }, [emit]);

  const deleteMessage = useCallback((messageId, conversationId, forEveryone = false) => {
    emit('delete_message', { messageId, conversationId, deleteForEveryone: forEveryone });
  }, [emit]);

  const setReplyTo = useCallback((message) => {
    dispatch({ type: 'SET_REPLY_TO', payload: message });
  }, []);

  const clearReply = useCallback(() => {
    dispatch({ type: 'CLEAR_REPLY' });
  }, []);

  const getOrCreateConversation = useCallback(async (otherUserId) => {
    const data = await chatsAPI.getOrCreateConversation(otherUserId);
    const conv = data.conversation;
    dispatch({ type: 'ADD_OR_UPDATE_CONVERSATION', payload: conv });
    return conv;
  }, []);

  return (
    <ChatContext.Provider value={{
      ...state,
      loadConversations,
      loadMessages,
      setActiveConversation,
      sendMessage,
      startTyping,
      stopTyping,
      deleteMessage,
      setReplyTo,
      clearReply,
      getOrCreateConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}

export default ChatContext;
