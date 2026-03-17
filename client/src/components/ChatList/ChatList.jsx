import React, { useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatListItem from './ChatListItem';
import styles from './ChatList.module.css';

function SkeletonItem() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonAvatar} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
      </div>
    </div>
  );
}

export default function ChatList({ searchQuery }) {
  const { conversations, activeConversation, setActiveConversation, unreadCounts, isLoadingConversations } = useChat();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      c.other_user_name?.toLowerCase().includes(q) ||
      c.other_user_phone?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  if (isLoadingConversations) {
    return (
      <div className={styles.list}>
        {[...Array(6)].map((_, i) => <SkeletonItem key={i} />)}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className={styles.list}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>💬</span>
          {searchQuery ? `No chats match "${searchQuery}"` : 'No conversations yet.\nClick the chat icon to start one!'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {filtered.map(conv => (
        <ChatListItem
          key={conv.id}
          conversation={conv}
          isActive={activeConversation?.id === conv.id}
          onClick={() => setActiveConversation(conv)}
          unreadCount={unreadCounts[conv.id] || 0}
        />
      ))}
    </div>
  );
}
