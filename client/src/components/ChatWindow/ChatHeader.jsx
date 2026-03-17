import React from 'react';
import Avatar from '../common/Avatar';
import { formatLastSeen } from '../../utils/formatTime';
import { MdSearch, MdMoreVert } from 'react-icons/md';
import styles from './ChatWindow.module.css';

export default function ChatHeader({ conversation, isTyping }) {
  const isOnline = conversation.other_user_online === 1;

  let statusText;
  if (isTyping) {
    statusText = 'typing...';
  } else {
    statusText = formatLastSeen(conversation.other_user_last_seen, isOnline);
  }

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Avatar
          src={conversation.other_user_avatar}
          name={conversation.other_user_name}
          size={40}
          isOnline={isOnline}
        />
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{conversation.other_user_name}</div>
          <div className={`${styles.headerStatus} ${isTyping ? styles.typing : isOnline ? styles.online : ''}`}>
            {statusText}
          </div>
        </div>
      </div>
      <div className={styles.headerRight}>
        <button className={styles.iconBtn} title="Search">
          <MdSearch size={22} />
        </button>
        <button className={styles.iconBtn} title="Menu">
          <MdMoreVert size={22} />
        </button>
      </div>
    </div>
  );
}
