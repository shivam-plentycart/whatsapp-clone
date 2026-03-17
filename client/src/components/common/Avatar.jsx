import React, { useState, useEffect } from 'react';
import styles from './common.module.css';
import { UPLOADS_URL } from '../../utils/constants';

export default function Avatar({ src, name, size = 40, isOnline = false, className = '' }) {
  const [imgError, setImgError] = useState(false);

  // Reset error when src changes so new avatar loads correctly
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorFromName = (name) => {
    const colors = ['#00a884', '#008069', '#25d366', '#075e54', '#128c7e', '#34b7f1', '#ec5f67', '#9b59b6', '#e67e22'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarSrc = src && src !== 'default-avatar.png' && !imgError
    ? `${UPLOADS_URL}/${src}`
    : null;

  return (
    <div
      className={`${styles.avatar} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={name || 'Avatar'}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : (
        <div
          className={styles.avatarInitials}
          style={{ background: getColorFromName(name), fontSize: size * 0.35 }}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline && <span className={styles.onlineDot} />}
    </div>
  );
}
