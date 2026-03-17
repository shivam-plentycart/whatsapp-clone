import React from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, placeholder = 'Search or start new chat' }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBox}>
        <MdSearch size={20} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {value && (
          <button className={styles.clearBtn} onClick={() => onChange('')}>
            <MdClose size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
