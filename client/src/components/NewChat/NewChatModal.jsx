import React, { useState, useCallback } from 'react';
import { usersAPI } from '../../utils/api';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import SearchBar from '../SearchBar/SearchBar';
import LoadingSpinner from '../common/LoadingSpinner';
import { MdArrowBack } from 'react-icons/md';
import styles from './NewChatModal.module.css';

export default function NewChatModal({ onClose }) {
  const { getOrCreateConversation, setActiveConversation } = useChat();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchTimeout = React.useRef(null);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!value.trim()) {
      setUsers([]);
      setSearched(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const data = await usersAPI.search(value.trim());
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleUserClick = async (otherUser) => {
    try {
      const conv = await getOrCreateConversation(otherUser.id);
      await setActiveConversation(conv);
      onClose();
    } catch (err) {
      console.error('Start chat error:', err);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <MdArrowBack size={24} />
        </button>
        <span className={styles.title}>New chat</span>
      </div>

      <SearchBar
        value={query}
        onChange={handleSearch}
        placeholder="Search by name or phone number"
      />

      {!searched && !query && (
        <div className={styles.hint}>
          Search for a user to start a new conversation
        </div>
      )}

      <div className={styles.results}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <LoadingSpinner size="medium" />
          </div>
        ) : users.length > 0 ? (
          users.map(u => (
            <div key={u.id} className={styles.userItem} onClick={() => handleUserClick(u)}>
              <Avatar src={u.avatar} name={u.name} size={49} isOnline={u.is_online === 1} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>{u.name}</div>
                <div className={styles.userPhone}>{u.phone}</div>
              </div>
            </div>
          ))
        ) : searched && !loading ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <span>No users found for "{query}"</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
