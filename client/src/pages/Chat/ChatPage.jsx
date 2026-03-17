import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import { useChat } from '../../context/ChatContext';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const location = useLocation();
  const { setActiveConversation, loadConversations } = useChat();

  // Auto-open conversation passed via invite flow
  useEffect(() => {
    const conv = location.state?.openConversation;
    if (conv) {
      loadConversations().then(() => {
        setActiveConversation(conv);
      });
    }
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <Sidebar />
        </div>
        <div className={styles.chatArea}>
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
