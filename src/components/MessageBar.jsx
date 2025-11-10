import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';

export default function MessageBar({ statusCounts, onMessageClick }) {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const [messages, setMessages] = useState([]);

  // Load messages and group by category with counts
  const loadMessages = useCallback(async () => {
    if (!db || !currentUser) return;

    try {
      // Get all messages
      const allMessages = await db.messages.toArray();

      // Get read messages for current user
      const readMessages = await db.message_reads
        .where('user_id', '==', currentUser.uid)
        .toArray();

      const readMessageIds = new Set(readMessages.map(r => r.message_id));

      // Filter messages to show in bar:
      // 1. Messages pinned to bar (always show)
      // 2. Urgent/Alert messages that are not read
      // 3. Announcement/Info messages that are not read
      const visibleMessages = allMessages.filter(msg => {
        // Always show if pinned to bar
        if (msg.pinned_to_bar) return true;

        // For urgent and alert, show if not read
        if (msg.category === 'urgent' || msg.category === 'alert') {
          return !readMessageIds.has(msg.id);
        }

        // For announcement and info, show if not read
        if (msg.category === 'announcement' || msg.category === 'info') {
          return !readMessageIds.has(msg.id);
        }

        return false;
      });

      // Group messages by category and count them
      const groupedMessages = {};

      visibleMessages.forEach(msg => {
        const category = msg.category;
        if (!groupedMessages[category]) {
          groupedMessages[category] = {
            category: category,
            count: 0,
            messages: []
          };
        }
        groupedMessages[category].count++;
        groupedMessages[category].messages.push(msg);
      });

      // Add missing items as a category if there are any
      if (statusCounts.missing > 0) {
        groupedMessages['missing'] = {
          category: 'missing',
          count: statusCounts.missing,
          messages: [],
          isSynthetic: true
        };
      }

      // Convert to array and sort by priority
      const priorityOrder = { urgent: 1, missing: 2, alert: 3, announcement: 4, info: 5 };
      const messageGroups = Object.values(groupedMessages).sort((a, b) => {
        const aPriority = priorityOrder[a.category] || 99;
        const bPriority = priorityOrder[b.category] || 99;
        return aPriority - bPriority;
      });

      setMessages(messageGroups);
    } catch (error) {
      console.error('Error loading messages for bar:', error);
    }
  }, [db, currentUser, statusCounts.missing]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Get emoji for message category
  const getCategoryEmoji = (category) => {
    const emojis = {
      urgent: '🚨',
      missing: '⚠️',
      alert: '⚠️',
      announcement: '📢',
      info: 'ℹ️'
    };
    return emojis[category] || 'ℹ️';
  };

  // Get background color for message category
  const getCategoryBg = (category) => {
    const colors = {
      urgent: 'rgba(244, 67, 54, 0.25)',
      missing: 'rgba(255, 193, 7, 0.25)',
      alert: 'rgba(255, 193, 7, 0.25)',
      announcement: 'rgba(255, 165, 0, 0.25)',
      info: 'rgba(33, 150, 243, 0.25)'
    };
    return colors[category] || colors.info;
  };

  // Get border color for message category
  const getCategoryBorder = (category) => {
    const colors = {
      urgent: '#f44336',
      missing: '#ffc107',
      alert: '#ffc107',
      announcement: '#ffa500',
      info: '#2196f3'
    };
    return colors[category] || colors.info;
  };

  // Get text color for message category
  const getCategoryColor = (category) => {
    const colors = {
      urgent: '#ff6b6b',
      missing: '#ffeb3b',
      alert: '#ffeb3b',
      announcement: '#ffa500',
      info: '#64b5f6'
    };
    return colors[category] || colors.info;
  };

  // Handle message click
  const handleMessageClick = async (messageGroup) => {
    if (messageGroup.category === 'missing') {
      // Click on missing items alert - navigate to gear list with missing filter
      if (onMessageClick) {
        onMessageClick('gear', 'missing');
      }
    } else if (messageGroup.category === 'announcement' || messageGroup.category === 'info') {
      // Mark announcements and info as read when clicked
      if (messageGroup.messages && messageGroup.messages.length > 0) {
        try {
          for (const msg of messageGroup.messages) {
            // Check if already read
            const existingRead = await db.message_reads
              .where('user_id', '==', currentUser.uid)
              .toArray();

            const alreadyRead = existingRead.some(r => r.message_id === msg.id);

            if (!alreadyRead) {
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
      }

      // Navigate to messages page
      if (onMessageClick) {
        onMessageClick('messages');
      }
    } else {
      // Urgent and Alert - don't mark as read, just navigate to messages page
      if (onMessageClick) {
        onMessageClick('messages');
      }
    }
  };

  // Get label for category
  const getCategoryLabel = (category, count) => {
    const labels = {
      urgent: 'Urgent',
      missing: count === 1 ? 'Item missing' : 'Items missing',
      alert: 'Alert',
      announcement: 'Announcement',
      info: 'Info'
    };
    return labels[category] || category;
  };

  // Always show the bar to prevent layout shift, even when empty
  // Show a subtle placeholder when there are no messages

  const styles = {
    messageBarContainer: {
      background: '#2d2d2d',
      padding: '12px 0',
      borderRadius: '6px',
      marginBottom: '16px',
      borderLeft: '4px solid #ffa500',
      overflow: 'hidden'
    },
    messageBarScroller: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '0 16px',
      scrollbarWidth: 'thin',
      scrollbarColor: '#ffa500 #2d2d2d',
      WebkitOverflowScrolling: 'touch'
    },
    messageChip: (category) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      background: getCategoryBg(category),
      border: `2px solid ${getCategoryBorder(category)}`,
      borderRadius: '20px',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.2s',
      minWidth: 'fit-content',
      whiteSpace: 'nowrap'
    }),
    messageEmoji: {
      fontSize: '16px'
    },
    messageText: (category) => ({
      fontSize: '13px',
      fontWeight: '600',
      color: getCategoryColor(category),
      letterSpacing: '0.3px'
    })
  };

  return (
    <div style={styles.messageBarContainer}>
      <div style={styles.messageBarScroller}>
        {messages.length === 0 ? (
          <div style={{
            padding: '8px 16px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            width: '100%'
          }}>
            No new notifications
          </div>
        ) : (
          messages.map((messageGroup, index) => (
          <div
            key={messageGroup.category || index}
            style={styles.messageChip(messageGroup.category)}
            onClick={() => handleMessageClick(messageGroup)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={styles.messageEmoji}>
              {getCategoryEmoji(messageGroup.category)}
            </span>
            <span style={styles.messageText(messageGroup.category)}>
              {messageGroup.count} {getCategoryLabel(messageGroup.category, messageGroup.count)}
            </span>
          </div>
          ))
        )}
      </div>
      <style>{`
        .messageBarScroller::-webkit-scrollbar {
          height: 6px;
        }
        .messageBarScroller::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 3px;
        }
        .messageBarScroller::-webkit-scrollbar-thumb {
          background: #ffa500;
          border-radius: 3px;
        }
        .messageBarScroller::-webkit-scrollbar-thumb:hover {
          background: #ff8800;
        }
      `}</style>
    </div>
  );
}
