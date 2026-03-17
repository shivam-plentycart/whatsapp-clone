import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inviteAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import styles from './InvitePage.module.css';

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    inviteAPI.getInfo(token)
      .then(data => setInvite(data.invite))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      // Save invite token so we can auto-accept after login/register
      localStorage.setItem('pending_invite', token);
      navigate('/register');
      return;
    }

    setAccepting(true);
    try {
      const data = await inviteAPI.accept(token);
      navigate('/', { state: { openConversation: data.conversation } });
    } catch (err) {
      setError(err.message);
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <img src="/whatsapp-logo.svg" alt="" width={48} height={48} onError={e => e.target.style.display='none'} />
          </div>
          <h2 className={styles.title}>Invalid Invite</h2>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.button} onClick={() => navigate('/')}>Go to WhatsApp</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.subtitle}>You've been invited to chat on</p>
          <h1 className={styles.appName}>WhatsApp</h1>
        </div>

        <div className={styles.creatorSection}>
          <Avatar src={invite.creatorAvatar} name={invite.creatorName} size={80} />
          <h2 className={styles.creatorName}>{invite.creatorName}</h2>
          {invite.creatorAbout && (
            <p className={styles.creatorAbout}>{invite.creatorAbout}</p>
          )}
        </div>

        <p className={styles.description}>
          {isAuthenticated
            ? `Click below to start chatting with ${invite.creatorName}.`
            : `Register or log in to start chatting with ${invite.creatorName}.`}
        </p>

        <button
          className={styles.button}
          onClick={handleJoin}
          disabled={accepting}
        >
          {accepting ? 'Opening chat...' : isAuthenticated ? 'Start Chatting' : 'Register & Chat'}
        </button>

        {!isAuthenticated && (
          <p className={styles.loginHint}>
            Already have an account?{' '}
            <span className={styles.link} onClick={() => {
              localStorage.setItem('pending_invite', token);
              navigate('/login');
            }}>
              Log in
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
