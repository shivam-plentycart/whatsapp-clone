import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { COUNTRY_CODES } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MdCameraAlt, MdPerson } from 'react-icons/md';
import styles from './Register.module.css';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    setAvatar(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Name is required'); return; }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
    if (!phone.trim()) { setError('Phone number is required'); return; }
    if (!/^\d{6,15}$/.test(phone.trim())) { setError('Enter a valid phone number'); return; }

    const fullPhone = `${countryCode}${phone.trim()}`;
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('phone', fullPhone);
    formData.append('about', 'Hey there! I am using WhatsApp');
    if (avatar) formData.append('avatar', avatar);

    setLoading(true);
    try {
      const data = await register(formData);
      if (data.demo_otp) {
        console.log(`📱 Demo OTP: ${data.demo_otp}`);
        alert(`📱 Registration successful!\nDemo OTP: ${data.demo_otp}\n(Check server console too)`);
      }
      navigate('/verify-otp', { state: { phone: fullPhone } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join WhatsApp Web today</p>
        </div>

        {/* Avatar picker */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className={styles.avatarPreview} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <MdPerson size={40} />
                <span>Add Photo</span>
              </div>
            )}
            <div className={styles.cameraOverlay}>
              <MdCameraAlt size={16} />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Enter your name"
              value={name}
              onChange={e => { setError(''); setName(e.target.value); }}
              autoFocus
              maxLength={100}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <div className={styles.phoneRow}>
              <select
                className={styles.countrySelect}
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className={styles.input}
                placeholder="Enter phone number"
                value={phone}
                onChange={e => { setError(''); setPhone(e.target.value.replace(/\D/g, '')); }}
                maxLength={15}
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <span className={styles.spinnerWrapper}>
                <LoadingSpinner size="small" color="white" />
                Registering...
              </span>
            ) : 'REGISTER'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?
          <Link to="/login" className={styles.link}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
