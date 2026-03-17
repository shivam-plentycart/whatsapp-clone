/**
 * Format timestamp like WhatsApp does
 */

export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatConversationTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}

export function formatDateSeparator(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const diffMs = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';

  return new Date(timestamp).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatLastSeen(timestamp, isOnline) {
  if (isOnline) return 'online';
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'last seen just now';
  if (diffMins < 60) return `last seen ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `last seen today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return `last seen yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  return `last seen ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
}

export function isSameDay(timestamp1, timestamp2) {
  if (!timestamp1 || !timestamp2) return false;
  const d1 = new Date(timestamp1);
  const d2 = new Date(timestamp2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
