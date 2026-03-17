import React, { useRef, useEffect } from 'react';
import styles from './ContextMenu.module.css';

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Adjust position to avoid overflow
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - (items.length * 44 + 16));

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ top: adjustedY, left: adjustedX }}
    >
      {items.map((item, i) => (
        item.divider
          ? <div key={i} className={styles.divider} />
          : (
            <button
              key={i}
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              onClick={() => { item.onClick(); onClose(); }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          )
      ))}
    </div>
  );
}
