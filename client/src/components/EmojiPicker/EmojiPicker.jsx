import React, { useState, useRef, useEffect } from 'react';
import { EMOJIS } from '../../utils/constants';
import styles from './EmojiPicker.module.css';

export default function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = search
    ? EMOJIS.filter(e => e.includes(search))
    : EMOJIS;

  return (
    <div ref={ref} className={styles.picker}>
      <div className={styles.header}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search emoji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className={styles.grid}>
        {filtered.map((emoji, i) => (
          <span
            key={i}
            className={styles.emoji}
            onClick={() => onSelect(emoji)}
            title={emoji}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
