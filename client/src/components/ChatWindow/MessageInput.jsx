import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import ReplyPreview from './ReplyPreview';
import EmojiPicker from '../EmojiPicker/EmojiPicker';
import { MdSend, MdMic, MdEmojiEmotions, MdAttachFile } from 'react-icons/md';
import styles from './ChatWindow.module.css';

export default function MessageInput({ conversationId, receiverId }) {
  const { sendMessage, startTyping, stopTyping, replyTo, clearReply } = useChat();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [text]);

  // Focus on conversation change
  useEffect(() => {
    textareaRef.current?.focus();
    setText('');
    clearReply();
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      startTyping(conversationId, receiverId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      stopTyping(conversationId, receiverId);
    }, 1500);
  }, [conversationId, receiverId, startTyping, stopTyping]);

  const handleChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) handleTyping();
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || isSending) return;

    // Stop typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      stopTyping(conversationId, receiverId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setText('');
    clearReply();
    setShowEmoji(false);
    setIsSending(true);

    try {
      await sendMessage(conversationId, receiverId, content, replyTo?.id || null);
    } catch (err) {
      console.error('Send error:', err);
      setText(content); // restore on error
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + emoji.length;
    });
  };

  return (
    <>
      {/* Emoji picker */}
      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Reply preview */}
      {replyTo && <ReplyPreview message={replyTo} onClose={clearReply} />}

      {/* Input row */}
      <div className={styles.inputArea}>
        <button
          className={`${styles.emojiBtn} ${showEmoji ? styles.active : ''}`}
          onClick={() => setShowEmoji(s => !s)}
          title="Emoji"
        >
          <MdEmojiEmotions size={26} />
        </button>

        <button className={styles.attachBtn} title="Attach file">
          <MdAttachFile size={24} />
        </button>

        <div className={styles.textInputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            placeholder="Type a message"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        {text.trim() ? (
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={isSending}
            title="Send"
          >
            <MdSend size={22} />
          </button>
        ) : (
          <button className={styles.micBtn} title="Voice message">
            <MdMic size={22} />
          </button>
        )}
      </div>
    </>
  );
}
