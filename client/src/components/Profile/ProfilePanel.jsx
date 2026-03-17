import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, uploadAPI } from '../../utils/api';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { MdArrowBack, MdEdit, MdCheck, MdClose, MdCameraAlt } from 'react-icons/md';
import styles from './ProfilePanel.module.css';

export default function ProfilePanel({ onClose }) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user?.name) {
      setEditingName(false);
      setName(user?.name || '');
      return;
    }
    setSaving(true);
    try {
      const data = await usersAPI.updateProfile({ name: name.trim() });
      updateUser(data.user);
      showSuccess('Name updated!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setEditingName(false);
    }
  };

  const handleSaveAbout = async () => {
    if (about === user?.about) {
      setEditingAbout(false);
      return;
    }
    setSaving(true);
    try {
      const data = await usersAPI.updateProfile({ about: about.trim() });
      updateUser(data.user);
      showSuccess('About updated!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setEditingAbout(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const data = await uploadAPI.uploadAvatar(formData);
      updateUser(data.user);
      showSuccess('Profile photo updated!');
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <MdArrowBack size={24} />
        </button>
        <span className={styles.title}>Profile</span>
      </div>

      {/* Avatar section */}
      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
          {uploadingAvatar ? (
            <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner size="medium" />
            </div>
          ) : (
            <>
              <Avatar src={user?.avatar} name={user?.name} size={120} />
              <div className={styles.avatarOverlay}>
                <MdCameraAlt size={28} />
                <span>Change Photo</span>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

      {/* Name section */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Your Name</div>
        <div className={styles.fieldRow}>
          <div className={styles.fieldContent}>
            {editingName ? (
              <>
                <input
                  type="text"
                  className={styles.editInput}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setEditingName(false); setName(user?.name || ''); }
                  }}
                />
                <div className={styles.charCount}>{name.length}/100</div>
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={() => { setEditingName(false); setName(user?.name || ''); }}>
                    Cancel
                  </button>
                  <button className={styles.saveBtn} onClick={handleSaveName} disabled={saving || !name.trim()}>
                    {saving ? <LoadingSpinner size="small" color="white" /> : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.fieldValue}>{user?.name}</div>
            )}
          </div>
          {!editingName && (
            <button className={styles.editBtn} onClick={() => setEditingName(true)}>
              <MdEdit size={20} />
            </button>
          )}
        </div>
      </div>

      {/* About section */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>About</div>
        <div className={styles.fieldRow}>
          <div className={styles.fieldContent}>
            {editingAbout ? (
              <>
                <input
                  type="text"
                  className={styles.editInput}
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  maxLength={200}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveAbout();
                    if (e.key === 'Escape') { setEditingAbout(false); setAbout(user?.about || ''); }
                  }}
                />
                <div className={styles.charCount}>{about.length}/200</div>
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={() => { setEditingAbout(false); setAbout(user?.about || ''); }}>
                    Cancel
                  </button>
                  <button className={styles.saveBtn} onClick={handleSaveAbout} disabled={saving}>
                    {saving ? <LoadingSpinner size="small" color="white" /> : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.fieldValue}>{user?.about}</div>
            )}
          </div>
          {!editingAbout && (
            <button className={styles.editBtn} onClick={() => setEditingAbout(true)}>
              <MdEdit size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Phone section */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Phone</div>
        <div className={styles.fieldValue}>{user?.phone}</div>
        <div className={styles.phoneNote}>Your phone number is not shown to others</div>
      </div>
    </div>
  );
}
