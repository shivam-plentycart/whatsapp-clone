import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { COUNTRY_CODES } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './Login.module.css';

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { sendOTP, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!phone.trim()) {
      setLocalError('Please enter your phone number');
      return;
    }
    if (!/^\d{6,15}$/.test(phone.trim())) {
      setLocalError('Please enter a valid phone number (digits only)');
      return;
    }

    const fullPhone = `${countryCode}${phone.trim()}`;
    setLoading(true);
    try {
      const data = await sendOTP(fullPhone);
      // For demo: show OTP in alert
      if (data.demo_otp) {
        console.log(`📱 Demo OTP: ${data.demo_otp}`);
        alert(`📱 Demo OTP: ${data.demo_otp}\n(Check server console too)`);
      }
      navigate('/verify-otp', { state: { phone: fullPhone } });
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><WhatsAppLogo /></div>
          <h1 className={styles.title}>WhatsApp Web</h1>
          <p className={styles.subtitle}>Sign in with your mobile number</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {localError && (
            <div className={styles.error}>{localError}</div>
          )}

          <div>
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
                onChange={e => {
                  setLocalError('');
                  setPhone(e.target.value.replace(/\D/g, ''));
                }}
                maxLength={15}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading || isLoading}>
            {loading ? (
              <span className={styles.spinnerWrapper}>
                <LoadingSpinner size="small" color="white" />
                Sending OTP...
              </span>
            ) : 'SEND OTP'}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account?
          <Link to="/register" className={styles.link}>Register</Link>
        </div>
      </div>
    </div>
  );
}
