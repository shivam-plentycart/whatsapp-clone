import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './ChatWindow.module.css';
import { MdChatBubbleOutline, MdReply, MdContentCopy, MdDelete, MdDeleteForever } from 'react-icons/md';

export default function ChatWindow() {
  const { activeConversation, typingUsers, deleteMessage, setReplyTo } = useChat();
  const { user } = useAuth();

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, message }
  const ctxRef = useRef(null);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleContextMenu = useCallback((e, message) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setCtxMenu({ x, y, message });
  }, []);

  const handleReply = () => {
    if (ctxMenu?.message) {
      setReplyTo(ctxMenu.message);
    }
    setCtxMenu(null);
  };

  const handleCopy = () => {
    if (ctxMenu?.message?.content) {
      navigator.clipboard.writeText(ctxMenu.message.content).catch(() => {});
    }
    setCtxMenu(null);
  };

  const handleDeleteForMe = () => {
    if (ctxMenu?.message) {
      deleteMessage(ctxMenu.message.id, ctxMenu.message.conversation_id, false);
    }
    setCtxMenu(null);
  };

  const handleDeleteForEveryone = () => {
    if (ctxMenu?.message) {
      deleteMessage(ctxMenu.message.id, ctxMenu.message.conversation_id, true);
    }
    setCtxMenu(null);
  };

  const isTyping = activeConversation
    ? typingUsers[activeConversation.id]?.isTyping &&
      typingUsers[activeConversation.id]?.userId === activeConversation.other_user_id
    : false;

  if (!activeConversation) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>
            <MdChatBubbleOutline size={80} color="rgba(255,255,255,0.9)" />
          </div>
          <h2 className={styles.emptyTitle}>WhatsApp Web</h2>
          <p className={styles.emptySubtitle}>
            Send and receive messages without keeping your phone online.<br />
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 6 }}>
            <span className={styles.emptyDot} />
            <span className={styles.emptyDot} />
            <span className={styles.emptyDot} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      {/* Header */}
      <ChatHeader conversation={activeConversation} isTyping={isTyping} />

      {/* Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <MessageList
          conversationId={activeConversation.id}
          onContextMenu={handleContextMenu}
        />

        {/* Typing indicator */}
        {isTyping && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDots}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
            typing...
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput
        conversationId={activeConversation.id}
        receiverId={activeConversation.other_user_id}
      />

      {/* Context Menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className={styles.contextMenu}
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          <button className={styles.ctxItem} onClick={handleReply}>
            <MdReply size={18} /> Reply
          </button>
          {!ctxMenu.message.is_deleted_for_everyone && (
            <button className={styles.ctxItem} onClick={handleCopy}>
              <MdContentCopy size={18} /> Copy
            </button>
          )}
          <div className={styles.ctxDivider} />
          <button className={`${styles.ctxItem} ${styles.danger}`} onClick={handleDeleteForMe}>
            <MdDelete size={18} /> Delete for me
          </button>
          {ctxMenu.message.sender_id === user?.id && !ctxMenu.message.is_deleted_for_everyone && (
            <button className={`${styles.ctxItem} ${styles.danger}`} onClick={handleDeleteForEveryone}>
              <MdDeleteForever size={18} /> Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
