import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import { formatDateSeparator, isSameDay } from '../../utils/formatTime';
import { MdKeyboardArrowDown } from 'react-icons/md';
import styles from './ChatWindow.module.css';

export default function MessageList({ conversationId, onContextMenu }) {
  const { user } = useAuth();
  const { messages, isLoadingMessages, pagination, loadMessages } = useChat();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const msgs = messages[conversationId] || [];
  const pageInfo = pagination[conversationId];

  // Auto-scroll to bottom on new messages if already at bottom
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [conversationId]);

  const handleScroll = useCallback((e) => {
    const el = e.target;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distFromBottom < 100;
    setIsAtBottom(atBottom);
    setShowScrollBtn(!atBottom);

    // Load more on scroll to top
    if (el.scrollTop < 100 && pageInfo?.hasMore && !isLoadingMessages) {
      const oldHeight = el.scrollHeight;
      loadMessages(conversationId, (pageInfo?.page || 1) + 1).then(() => {
        // Maintain scroll position
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - oldHeight;
        });
      });
    }
  }, [pageInfo, isLoadingMessages, loadMessages, conversationId]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.background = 'rgba(0, 168, 132, 0.15)';
      setTimeout(() => { el.style.background = ''; }, 1500);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`${styles.messageArea} chat-wallpaper`}
        onScroll={handleScroll}
      >
        {/* Load more */}
        {pageInfo?.hasMore && (
          <div className={styles.loadMore}>
            <button
              className={styles.loadMoreBtn}
              onClick={() => loadMessages(conversationId, (pageInfo.page || 1) + 1)}
              disabled={isLoadingMessages}
            >
              {isLoadingMessages ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {msgs.map((msg, index) => {
          const prev = msgs[index - 1];
          const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at);

          // Hide deleted-for-me messages from the receiver/sender who deleted them
          if (msg.is_deleted && !msg.is_deleted_for_everyone) {
            if (msg.sender_id !== user?.id) return null;
          }

          return (
            <React.Fragment key={msg.id}>
              {showDateSep && (
                <div className={styles.dateSeparator} id={`date-${msg.id}`}>
                  <span className={styles.datePill}>
                    {formatDateSeparator(msg.created_at)}
                  </span>
                </div>
              )}
              <div id={`msg-${msg.id}`}>
                <MessageBubble
                  message={msg}
                  onContextMenu={onContextMenu}
                  onReplyClick={scrollToMessage}
                />
              </div>
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button className={styles.scrollToBottom} onClick={scrollToBottom}>
          <MdKeyboardArrowDown size={24} />
        </button>
      )}
    </>
  );
}
