import React from 'react';
import { MdClose } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import styles from './ChatWindow.module.css';

export default function ReplyPreview({ message, onClose }) {
  const { user } = useAuth();
  if (!message) return null;

  const senderName = message.sender_id === user?.id ? 'You' : message.sender_name;

  return (
    <div className={styles.replyInputPreview}>
      <div className={styles.replyInputContent}>
        <div className={styles.replyInputName}>{senderName}</div>
        <div className={styles.replyInputText}>
          {message.is_deleted_for_everyone ? 'This message was deleted' : message.content}
        </div>
      </div>
      <button className={styles.replyCloseBtn} onClick={onClose}>
        <MdClose size={20} />
      </button>
    </div>
  );
}
