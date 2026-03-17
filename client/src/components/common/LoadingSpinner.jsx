import React from 'react';
import styles from './common.module.css';

export default function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  return (
    <div className={`${styles.spinner} ${styles[`spinner_${size}`]} ${styles[`spinner_${color}`]}`}>
      <div className={styles.spinnerCircle}></div>
    </div>
  );
}
