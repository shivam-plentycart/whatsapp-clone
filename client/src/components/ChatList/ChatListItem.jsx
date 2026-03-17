import React from 'react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { formatConversationTime } from '../../utils/formatTime';
import { IoCheckmark, IoCheckmarkDone } from 'react-icons/io5';
import styles from './ChatList.module.css';

function MessageTicks({ status, senderId, currentUserId }) {
  if (senderId !== currentUserId) return null;
  const color = status === 'read' ? '#53bdeb' : '#667781';
  if (status === 'sent') return <IoCheckmark size={16} color="#667781" />;
  return <IoCheckmarkDone size={16} color={color} />;
}

export default function ChatListItem({ conversation, isActive, onClick, unreadCount }) {
  const { user } = useAuth();

  const lastMsg = conversation.last_message_deleted
    ? 'This message was deleted'
    : conversation.last_message;

  const isLastMsgMine = conversation.last_message_sender_id === user?.id;

  return (
    <div
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <Avatar
        src={conversation.other_user_avatar}
        name={conversation.other_user_name}
        size={49}
        isOnline={conversation.other_user_online === 1}
      />

      <div className={styles.itemContent}>
        <div className={styles.itemTop}>
          <span className={styles.itemName}>{conversation.other_user_name}</span>
          <span className={`${styles.itemTime} ${unreadCount > 0 ? styles.unread : ''}`}>
            {formatConversationTime(conversation.last_message_time || conversation.updated_at)}
          </span>
        </div>

        <div className={styles.itemBottom}>
          <div className={styles.itemPreview}>
            {isLastMsgMine && lastMsg && (
              <span className={styles.ticksIcon}>
                <MessageTicks
                  status={conversation.last_message_status}
                  senderId={conversation.last_message_sender_id}
                  currentUserId={user?.id}
                />
              </span>
            )}
            <span className={`${styles.lastMsg} ${conversation.last_message_deleted ? styles.deleted : ''}`}>
              {lastMsg || ''}
            </span>
          </div>

          <div className={styles.itemRight}>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
