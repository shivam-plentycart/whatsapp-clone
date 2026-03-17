import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { inviteAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MdSms } from 'react-icons/md';
import styles from './OTPVerify.module.css';

export default function OTPVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, sendOTP, isAuthenticated, pendingPhone } = useAuth();

  const phone = location.state?.phone || pendingPhone || '';
  const inputsRef = useRef([]);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!phone) navigate('/login', { replace: true });
  }, [phone, navigate]);

  // Focus first box
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      const filled = [...otp];
      pasted.forEach((digit, i) => {
        if (index + i < 6) filled[index + i] = digit;
      });
      setOtp(filled);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(phone, otpString);

      // Auto-accept pending invite if any
      const pendingInvite = localStorage.getItem('pending_invite');
      if (pendingInvite) {
        localStorage.removeItem('pending_invite');
        try {
          const data = await inviteAPI.accept(pendingInvite);
          navigate('/', { replace: true, state: { openConversation: data.conversation } });
          return;
        } catch {
          // ignore invite error, just go home
        }
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setCanResend(false);
    setCountdown(30);
    setOtp(['', '', '', '', '', '']);
    try {
      const data = await sendOTP(phone);
      if (data.demo_otp) {
        console.log(`📱 New OTP: ${data.demo_otp}`);
        alert(`📱 New OTP: ${data.demo_otp}`);
      }
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <MdSms size={36} color="white" />
          </div>
          <h1 className={styles.title}>Enter OTP</h1>
          <p className={styles.phoneDisplay}>
            Code sent to <span className={styles.phoneNumber}>{phone}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.otpRow}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputsRef.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                className={`${styles.otpBox} ${digit ? styles.filled : ''}`}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={e => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
                  handleChange(i, pasted);
                }}
              />
            ))}
          </div>

          <button type="submit" className={styles.button} disabled={loading || otp.join('').length !== 6}>
            {loading ? (
              <span className={styles.spinnerWrapper}>
                <LoadingSpinner size="small" color="white" />
                Verifying...
              </span>
            ) : 'VERIFY OTP'}
          </button>
        </form>

        <div className={styles.resendSection}>
          Didn't receive the code?
          <button
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={!canResend}
          >
            Resend OTP
          </button>
          {!canResend && (
            <span className={styles.countdown}>{countdown}s</span>
          )}
        </div>

        <Link to="/login" className={styles.backLink}>← Back to Login</Link>
      </div>
    </div>
  );
}
