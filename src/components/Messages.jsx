import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { useRole } from '../hooks/useRole';

export default function Messages() {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const { isAdmin, isOwner } = useRole();
  const isAdminOrOwner = isAdmin || isOwner;

  const [messages, setMessages] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    category: 'announcement',
    content: '',
    pinned: false
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Load messages from database
  const loadMessages = useCallback(async () => {
    if (!db) return;

    try {
      const msgs = await db.messages.toArray();

      // Sort: Pinned first (by pinned_at desc), then by created_at desc
      const sorted = msgs.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.pinned && b.pinned) {
          const aTime = a.pinned_at?.toMillis?.() || a.pinned_at?.getTime?.() || 0;
          const bTime = b.pinned_at?.toMillis?.() || b.pinned_at?.getTime?.() || 0;
          return bTime - aTime;
        }
        const aTime = a.created_at?.toMillis?.() || a.created_at?.getTime?.() || 0;
        const bTime = b.created_at?.toMillis?.() || b.created_at?.getTime?.() || 0;
        return bTime - aTime;
      });

      setMessages(sorted);

      // Don't auto-mark messages as read anymore
      // Messages should only be marked as read when explicitly clicked from message bar
      // or when admin deletes them

      setLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  }, [db]);

  // Mark all messages as read for current user
  const markAllAsRead = async (messagesToMark) => {
    if (!currentUser || !db) return;

    try {
      for (const msg of messagesToMark) {
        // Check if already read
        const existingRead = await db.message_reads
          .where('user_id', '==', currentUser.uid)
          .toArray();

        const alreadyRead = existingRead.some(r => r.message_id === msg.id);

        if (!alreadyRead) {
          // Mark as read
          await db.message_reads.add({
            user_id: currentUser.uid,
            message_id: msg.id,
            read_at: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Check if a message is unread
  const isMessageUnread = useCallback(async (messageId) => {
    if (!currentUser || !db) return false;

    try {
      const reads = await db.message_reads
        .where('user_id', '==', currentUser.uid)
        .toArray();

      return !reads.some(r => r.message_id === messageId);
    } catch (error) {
      console.error('Error checking read status:', error);
      return false;
    }
  }, [currentUser, db]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Post new message
  const handlePostMessage = async (e) => {
    e.preventDefault();

    if (!postForm.category || !postForm.content.trim()) {
      setError('Category and message are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (postForm.content.length > 500) {
      setError('Message cannot exceed 500 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!db) {
      setError('Database not available');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      console.log('Attempting to post message...');
      const messageData = {
        category: postForm.category,
        content: postForm.content.trim(),
        author_name: currentUser.displayName || currentUser.email,
        author_email: currentUser.email,
        created_at: new Date(),
        pinned: postForm.pinned || false,
        pinned_at: postForm.pinned ? new Date() : null
      };

      console.log('Message data:', messageData);
      await db.messages.add(messageData);
      console.log('Message posted successfully');

      setMessage('✓ Message posted successfully');
      setTimeout(() => setMessage(''), 3000);

      setShowPostModal(false);
      setPostForm({ category: 'announcement', content: '', pinned: false });
      await loadMessages();

    } catch (error) {
      console.error('Error posting message:', error);
      setError(`Failed to post message: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Toggle pin status (pin to top of messages list)
  const handleTogglePin = async (messageId, currentlyPinned) => {
    try {
      await db.messages.update(messageId, {
        pinned: !currentlyPinned,
        pinned_at: !currentlyPinned ? new Date() : null
      });

      setMessage(currentlyPinned ? '✓ Message unpinned' : '✓ Message pinned to top');
      setTimeout(() => setMessage(''), 3000);

      loadMessages();

    } catch (error) {
      console.error('Error toggling pin:', error);
      setError('Failed to update message');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Toggle pin to message bar (show in top bar)
  const handleTogglePinToBar = async (messageId, currentlyPinnedToBar) => {
    try {
      await db.messages.update(messageId, {
        pinned_to_bar: !currentlyPinnedToBar,
        pinned_to_bar_at: !currentlyPinnedToBar ? new Date() : null
      });

      setMessage(currentlyPinnedToBar ? '✓ Removed from message bar' : '✓ Pinned to message bar');
      setTimeout(() => setMessage(''), 3000);

      loadMessages();

    } catch (error) {
      console.error('Error toggling bar pin:', error);
      setError('Failed to update message');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this message?\n\nThis cannot be undone.'
    );

    if (!confirmed) return;

    try {
      // Delete the message
      await db.messages.delete(messageId);

      // Delete all read records for this message
      const readRecords = await db.message_reads
        .where('message_id', '==', messageId)
        .toArray();

      for (const record of readRecords) {
        await db.message_reads.delete(record.id);
      }

      setMessage('✓ Message deleted');
      setTimeout(() => setMessage(''), 3000);

      loadMessages();

    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Helper functions for category styling
  const getCategoryIcon = (category) => {
    const icons = {
      urgent: '🚨',
      announcement: '📢',
      info: 'ℹ️',
      alert: '⚠️'
    };
    return icons[category] || icons.info;
  };

  const getCategoryColor = (category) => {
    const colors = {
      urgent: '#ff6b6b',
      announcement: '#ffa500',
      info: '#64b5f6',
      alert: '#ffeb3b'
    };
    return colors[category] || colors.info;
  };

  const getCategoryBg = (category) => {
    const colors = {
      urgent: 'rgba(244, 67, 54, 0.15)',
      announcement: 'rgba(255, 165, 0, 0.15)',
      info: 'rgba(33, 150, 243, 0.15)',
      alert: 'rgba(255, 193, 7, 0.15)'
    };
    return colors[category] || colors.info;
  };

  const getCategoryBorder = (category) => {
    const colors = {
      urgent: '#f44336',
      announcement: '#ffa500',
      info: '#2196f3',
      alert: '#ffc107'
    };
    return colors[category] || colors.info;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const styles = {
    container: {
      padding: '0'
    },
    pageTitle: {
      fontSize: '16px',
      color: '#ffa500',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    postButton: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '20px'
    },
    messageCard: (category) => ({
      padding: '16px',
      marginBottom: '12px',
      background: getCategoryBg(category),
      border: `2px solid ${getCategoryBorder(category)}`,
      borderLeft: `4px solid ${getCategoryBorder(category)}`,
      borderRadius: '6px',
      position: 'relative'
    }),
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    messageCategory: (category) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      fontWeight: '700',
      color: getCategoryColor(category),
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }),
    pinIcon: {
      fontSize: '14px',
      color: '#ffa500',
      marginRight: '8px'
    },
    messageContent: {
      fontSize: '14px',
      color: '#e0e0e0',
      lineHeight: '1.6',
      marginBottom: '12px',
      whiteSpace: 'pre-wrap'
    },
    messageFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#888',
      marginBottom: '8px'
    },
    messageAuthor: {
      fontWeight: '600',
      color: '#ccc'
    },
    messageTime: {
      color: '#666'
    },
    messageActions: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px'
    },
    actionButton: {
      padding: '8px 12px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '1px solid #ffa500',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    deleteButton: {
      padding: '8px 12px',
      background: '#2d2d2d',
      color: '#ff6b6b',
      border: '1px solid #ff6b6b',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center'
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '20px'
    },
    emptyTitle: {
      fontSize: '18px',
      color: '#ffa500',
      fontWeight: '700',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    emptyMessage: {
      fontSize: '14px',
      color: '#888',
      marginBottom: '24px',
      lineHeight: '1.6'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    modalCard: {
      background: '#2d2d2d',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      border: '2px solid #ffa500'
    },
    modalTitle: {
      fontSize: '18px',
      color: '#ffa500',
      fontWeight: '700',
      marginBottom: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '12px',
      fontWeight: '700',
      color: '#ffa500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      minHeight: '120px',
      resize: 'vertical',
      fontFamily: 'inherit',
      lineHeight: '1.5',
      boxSizing: 'border-box'
    },
    charCount: {
      fontSize: '12px',
      color: '#888',
      marginTop: '4px',
      textAlign: 'right'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer'
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      accentColor: '#ffa500',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '13px',
      color: '#ccc',
      cursor: 'pointer'
    },
    modalButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '24px'
    },
    submitButton: {
      flex: 1,
      padding: '14px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    cancelButton: {
      flex: 1,
      padding: '14px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>📨 Messages</h2>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          background: 'rgba(76, 175, 80, 0.2)',
          color: '#4caf50',
          border: '2px solid #4caf50',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          background: 'rgba(244, 67, 54, 0.2)',
          color: '#ff6b6b',
          border: '2px solid #ff6b6b',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {error}
        </div>
      )}

      {isAdminOrOwner && (
        <button style={styles.postButton} onClick={() => setShowPostModal(true)}>
          + Post New Message
        </button>
      )}

      {messages.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📨</div>
          <div style={styles.emptyTitle}>No Messages Yet</div>
          <div style={styles.emptyMessage}>
            {isAdminOrOwner
              ? 'Post your first message to communicate with your team.'
              : 'No messages from admins yet. Check back later for updates.'}
          </div>
        </div>
      ) : (
        <div>
          {messages.map((msg) => (
            <div key={msg.id} style={styles.messageCard(msg.category)}>
              <div style={styles.messageHeader}>
                <div style={styles.messageCategory(msg.category)}>
                  {msg.pinned && <span style={styles.pinIcon}>📌</span>}
                  <span>{getCategoryIcon(msg.category)}</span>
                  <span>{msg.category.toUpperCase()}</span>
                </div>
              </div>

              <div style={styles.messageContent}>{msg.content}</div>

              <div style={styles.messageFooter}>
                <span style={styles.messageAuthor}>{msg.author_name}</span>
                <span style={styles.messageTime}>{formatTimestamp(msg.created_at)}</span>
              </div>

              {isAdminOrOwner && (
                <div style={styles.messageActions}>
                  <button
                    style={styles.actionButton}
                    onClick={() => handleTogglePin(msg.id, msg.pinned)}
                  >
                    {msg.pinned ? '📌 Unpin' : '📌 Pin'}
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={() => handleTogglePinToBar(msg.id, msg.pinned_to_bar)}
                  >
                    {msg.pinned_to_bar ? '📍 Unpin from Bar' : '📍 Pin to Bar'}
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Message Modal */}
      {showPostModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPostModal(false);
            }
          }}
        >
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Post New Message</h3>

            <form onSubmit={handlePostMessage}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category *</label>
                <select
                  style={styles.select}
                  value={postForm.category}
                  onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                  required
                >
                  <option value="urgent">🚨 URGENT - Critical updates</option>
                  <option value="announcement">📢 ANNOUNCEMENT - General info</option>
                  <option value="info">ℹ️ INFO - Helpful details</option>
                  <option value="alert">⚠️ ALERT - Issues, lost property</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Message * (500 characters max)</label>
                <textarea
                  style={styles.textarea}
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  maxLength={500}
                  required
                />
                <div style={styles.charCount}>
                  {500 - postForm.content.length} characters remaining
                </div>
              </div>

              <div style={styles.checkbox}>
                <input
                  type="checkbox"
                  id="pinMessage"
                  style={styles.checkboxInput}
                  checked={postForm.pinned}
                  onChange={(e) => setPostForm({ ...postForm, pinned: e.target.checked })}
                />
                <label htmlFor="pinMessage" style={styles.checkboxLabel}>
                  Pin to top of messages list
                </label>
              </div>

              <div style={styles.modalButtons}>
                <button type="submit" style={styles.submitButton}>
                  Post Message
                </button>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
