import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { inviteAPI } from '../../utils/api';
import Avatar from '../common/Avatar';
import ChatList from '../ChatList/ChatList';
import SearchBar from '../SearchBar/SearchBar';
import NewChatModal from '../NewChat/NewChatModal';
import ProfilePanel from '../Profile/ProfilePanel';
import {
  MdChatBubbleOutline, MdMoreVert, MdLogout, MdPerson, MdClose, MdLink
} from 'react-icons/md';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { conversations, loadConversations } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
  };

  const handleCopyInviteLink = async () => {
    setShowMenu(false);
    try {
      const data = await inviteAPI.create();
      const link = `${window.location.origin}/invite/${data.token}`;
      await navigator.clipboard.writeText(link);
      alert(`Invite link copied!\n\n${link}`);
    } catch {
      alert('Failed to generate invite link');
    }
  };

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft} onClick={() => setShowProfile(true)}>
          <Avatar src={user?.avatar} name={user?.name} size={40} />
          <span className={styles.headerTitle}>WhatsApp</span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNewChat(true)}
            title="New chat"
          >
            <MdChatBubbleOutline size={22} />
          </button>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className={styles.iconBtn}
              onClick={() => setShowMenu(m => !m)}
              title="Menu"
            >
              <MdMoreVert size={22} />
            </button>
            {showMenu && (
              <div className={styles.menuDropdown}>
                <button className={styles.menuItem} onClick={() => { setShowMenu(false); setShowProfile(true); }}>
                  <MdPerson size={18} /> Profile
                </button>
                <button className={styles.menuItem} onClick={handleCopyInviteLink}>
                  <MdLink size={18} /> Copy invite link
                </button>
                <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
                  <MdLogout size={18} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Chat List */}
      <div className={styles.content}>
        <ChatList searchQuery={searchQuery} />
      </div>

      {/* Panels */}
      {showNewChat && (
        <div className={styles.panelOverlay}>
          <NewChatModal onClose={() => setShowNewChat(false)} />
        </div>
      )}
      {showProfile && (
        <div className={styles.panelOverlay}>
          <ProfilePanel onClose={() => setShowProfile(false)} />
        </div>
      )}
    </div>
  );
}
