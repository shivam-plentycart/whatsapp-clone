import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatMessageTime } from '../../utils/formatTime';
import { IoCheckmark, IoCheckmarkDone } from 'react-icons/io5';
import { MdBlock } from 'react-icons/md';
import styles from './ChatWindow.module.css';

function StatusTicks({ status }) {
  const isRead = status === 'read';
  const color = isRead ? '#53bdeb' : '#667781';

  if (status === 'sent') {
    return <IoCheckmark size={16} color="#667781" />;
  }
  return <IoCheckmarkDone size={16} color={color} />;
}

export default function MessageBubble({ message, onContextMenu, onReplyClick }) {
  const { user } = useAuth();
  const isSent = message.sender_id === user?.id;
  const isDeleted = message.is_deleted_for_everyone;

  const handleReplyClick = (e) => {
    e.stopPropagation();
    if (onReplyClick && message.reply_to_id) onReplyClick(message.reply_to_id);
  };

  return (
    <div
      className={`${styles.messageBubble} ${isSent ? styles.sent : styles.received} ${isDeleted ? styles.deleted : ''}`}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, message); }}
    >
      <div className={styles.bubbleInner}>
        {/* Reply preview */}
        {message.reply_to_id && !isDeleted && (
          <div className={styles.replyPreview} onClick={handleReplyClick}>
            <div className={styles.replyPreviewName}>
              {message.reply_sender_id === user?.id ? 'You' : message.reply_sender_name}
            </div>
            <div className={styles.replyPreviewText}>
              {message.reply_deleted ? 'This message was deleted' : message.reply_content}
            </div>
          </div>
        )}

        {/* Message text */}
        <span className={styles.bubbleText}>
          {isDeleted ? (
            <><MdBlock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />This message was deleted</>
          ) : (
            message.content
          )}
        </span>

        {/* Meta */}
        <div className={styles.bubbleMeta}>
          <span className={styles.bubbleTime}>{formatMessageTime(message.created_at)}</span>
          {isSent && !isDeleted && (
            <span className={`${styles.bubbleTicks} ${message.status === 'read' ? styles.read : ''}`}>
              <StatusTicks status={message.status} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
