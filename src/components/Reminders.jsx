import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';

export default function Reminders() {
  const { currentUser } = useAuth();
  const db = useDatabase();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newRelatedBand, setNewRelatedBand] = useState('');
  const [newRelatedGear, setNewRelatedGear] = useState('');

  // Filter state
  const [filterStatus, setFilterStatus] = useState('active'); // active, completed, all
  const [bands, setBands] = useState([]);
  const [gear, setGear] = useState([]);

  const loadReminders = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const allReminders = await db.reminders.where('userId', '==', currentUser.uid).toArray();

      // Sort: overdue first, then by due date, then by created date
      allReminders.sort((a, b) => {
        const now = new Date();
        const aDate = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate)) : null;
        const bDate = b.dueDate ? (b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate)) : null;

        const aOverdue = aDate && aDate < now && !a.completed;
        const bOverdue = bDate && bDate < now && !b.completed;

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (aDate && bDate) return aDate - bDate;
        if (aDate) return -1;
        if (bDate) return 1;

        const aCreated = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bCreated = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bCreated - aCreated;
      });

      setReminders(allReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setMessage('❌ Error loading reminders');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [db, currentUser]);

  const loadBandsAndGear = useCallback(async () => {
    try {
      const bandsData = await db.bands.toArray();
      const gearData = await db.gear.toArray();
      setBands(bandsData);
      setGear(gearData);
    } catch (error) {
      console.error('Error loading bands and gear:', error);
    }
  }, [db]);

  useEffect(() => {
    loadReminders();
    loadBandsAndGear();
  }, [loadReminders, loadBandsAndGear]);

  const handleAddReminder = async (e) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      setMessage('⚠️ Title is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.reminders.add({
        userId: currentUser.uid,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        dueDate: newDueDate ? new Date(newDueDate) : null,
        relatedBand: newRelatedBand || null,
        relatedGearId: newRelatedGear || null,
        completed: false,
        createdAt: new Date(),
        completedAt: null
      });

      setMessage('✅ Reminder added successfully');
      setTimeout(() => setMessage(''), 3000);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setNewRelatedBand('');
      setNewRelatedGear('');
      setShowAddForm(false);

      loadReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
      setMessage('❌ Error adding reminder');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      const newCompleted = !reminder.completed;
      await db.reminders.update(reminder.id, {
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : null
      });

      loadReminders();
    } catch (error) {
      console.error('Error toggling reminder:', error);
      setMessage('❌ Error updating reminder');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    const confirmed = window.confirm('Delete this reminder?');
    if (!confirmed) return;

    try {
      await db.reminders.delete(reminderId);
      setMessage('✅ Reminder deleted');
      setTimeout(() => setMessage(''), 3000);
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setMessage('❌ Error deleting reminder');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const isOverdue = (reminder) => {
    if (!reminder.dueDate || reminder.completed) return false;
    const dueDate = reminder.dueDate.toDate ? reminder.dueDate.toDate() : new Date(reminder.dueDate);
    return dueDate < new Date();
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const dueDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    const dateStr = dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diffDays < 0) {
      return { text: `${dateStr} (${Math.abs(diffDays)}d overdue)`, overdue: true };
    } else if (diffDays === 0) {
      return { text: `${dateStr} (Today)`, overdue: false };
    } else if (diffDays === 1) {
      return { text: `${dateStr} (Tomorrow)`, overdue: false };
    } else if (diffDays <= 7) {
      return { text: `${dateStr} (${diffDays}d)`, overdue: false };
    } else {
      return { text: dateStr, overdue: false };
    }
  };

  const getFilteredReminders = () => {
    if (filterStatus === 'active') {
      return reminders.filter(r => !r.completed);
    } else if (filterStatus === 'completed') {
      return reminders.filter(r => r.completed);
    }
    return reminders;
  };

  const filteredReminders = getFilteredReminders();

  const styles = {
    container: {
      padding: '0'
    },
    header: {
      marginTop: 0,
      marginBottom: '24px',
      fontSize: '16px',
      color: '#ffa500',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      textAlign: 'center'
    },
    message: {
      padding: '16px',
      marginBottom: '20px',
      background: message.includes('⚠️') || message.includes('❌')
        ? 'rgba(244, 67, 54, 0.2)'
        : 'rgba(76, 175, 80, 0.2)',
      color: message.includes('⚠️') || message.includes('❌') ? '#ff6b6b' : '#4caf50',
      border: `2px solid ${message.includes('⚠️') || message.includes('❌') ? '#ff6b6b' : '#4caf50'}`,
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600'
    },
    addButton: {
      width: '100%',
      padding: '16px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '24px'
    },
    formCard: {
      background: '#2d2d2d',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      border: '2px solid #664400'
    },
    formTitle: {
      marginTop: 0,
      marginBottom: '16px',
      fontSize: '18px',
      color: '#ffa500',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#ffa500'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '2px solid #664400',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '2px solid #664400',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      boxSizing: 'border-box',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px'
    },
    submitButton: {
      flex: 1,
      padding: '14px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    cancelButton: {
      flex: 1,
      padding: '14px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    filterButtons: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px'
    },
    filterButton: (isActive) => ({
      flex: 1,
      padding: '12px',
      background: isActive ? '#ffa500' : '#2d2d2d',
      color: isActive ? '#1a1a1a' : '#999',
      border: isActive ? 'none' : '2px solid #444',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }),
    reminderCard: (completed, overdue) => ({
      background: '#2d2d2d',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: overdue ? '2px solid #ff6b6b' : '1px solid #3a3a3a',
      borderLeft: overdue ? '4px solid #ff6b6b' : completed ? '4px solid #4caf50' : '4px solid #ffa500',
      opacity: completed ? 0.6 : 1
    }),
    reminderHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '8px'
    },
    checkbox: {
      width: '24px',
      height: '24px',
      cursor: 'pointer',
      marginTop: '2px',
      flexShrink: 0
    },
    reminderTitle: (completed) => ({
      fontSize: '16px',
      fontWeight: '700',
      color: completed ? '#888' : '#e0e0e0',
      textDecoration: completed ? 'line-through' : 'none',
      flex: 1,
      wordBreak: 'break-word'
    }),
    reminderDescription: {
      fontSize: '14px',
      color: '#ccc',
      marginBottom: '8px',
      marginLeft: '36px',
      lineHeight: '1.4'
    },
    reminderMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginLeft: '36px',
      alignItems: 'center'
    },
    metaBadge: (color, bgColor) => ({
      display: 'inline-block',
      padding: '4px 10px',
      background: bgColor,
      color: color,
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600'
    }),
    deleteButton: {
      padding: '6px 12px',
      background: 'rgba(244, 67, 54, 0.2)',
      color: '#ff6b6b',
      border: '2px solid #ff6b6b',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#888',
      fontSize: '14px'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        color: '#888'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffa500' }}>
          Loading reminders...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Personal Reminders</h2>

      {message && <div style={styles.message}>{message}</div>}

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)} style={styles.addButton}>
          + Add New Reminder
        </button>
      )}

      {showAddForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Reminder</h3>
          <form onSubmit={handleAddReminder}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Check guitar amp cables"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description (optional)</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Additional details..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Due Date (optional)</label>
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Related Band (optional)</label>
              <select
                value={newRelatedBand}
                onChange={(e) => setNewRelatedBand(e.target.value)}
                style={styles.input}
              >
                <option value="">None</option>
                {bands.map((band, idx) => (
                  <option key={idx} value={band.name}>
                    {band.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Related Gear (optional)</label>
              <select
                value={newRelatedGear}
                onChange={(e) => setNewRelatedGear(e.target.value)}
                style={styles.input}
              >
                <option value="">None</option>
                {gear.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.band_id} - {item.description} (#{String(item.display_id || '0000').padStart(4, '0')})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.submitButton}>
                Add Reminder
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle('');
                  setNewDescription('');
                  setNewDueDate('');
                  setNewRelatedBand('');
                  setNewRelatedGear('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filterButtons}>
        <button
          onClick={() => setFilterStatus('active')}
          style={styles.filterButton(filterStatus === 'active')}
        >
          Active
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          style={styles.filterButton(filterStatus === 'completed')}
        >
          Completed
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          style={styles.filterButton(filterStatus === 'all')}
        >
          All
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            {filterStatus === 'completed' ? '✓' : '📝'}
          </div>
          <div>
            {filterStatus === 'completed'
              ? 'No completed reminders'
              : filterStatus === 'active'
              ? 'No active reminders'
              : 'No reminders yet'}
          </div>
        </div>
      ) : (
        filteredReminders.map(reminder => {
          const overdueStatus = isOverdue(reminder);
          const dueDateInfo = reminder.dueDate ? formatDueDate(reminder.dueDate) : null;
          const relatedGearItem = reminder.relatedGearId
            ? gear.find(g => g.id === reminder.relatedGearId)
            : null;

          return (
            <div
              key={reminder.id}
              style={styles.reminderCard(reminder.completed, overdueStatus)}
            >
              <div style={styles.reminderHeader}>
                <input
                  type="checkbox"
                  checked={reminder.completed}
                  onChange={() => handleToggleComplete(reminder)}
                  style={styles.checkbox}
                />
                <div style={styles.reminderTitle(reminder.completed)}>
                  {reminder.title}
                </div>
              </div>

              {reminder.description && (
                <div style={styles.reminderDescription}>
                  {reminder.description}
                </div>
              )}

              <div style={styles.reminderMeta}>
                {dueDateInfo && (
                  <span
                    style={styles.metaBadge(
                      dueDateInfo.overdue ? '#ff6b6b' : '#4caf50',
                      dueDateInfo.overdue ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)'
                    )}
                  >
                    {dueDateInfo.text}
                  </span>
                )}

                {reminder.relatedBand && (
                  <span style={styles.metaBadge('#ffa500', 'rgba(255, 165, 0, 0.2)')}>
                    🎸 {reminder.relatedBand}
                  </span>
                )}

                {relatedGearItem && (
                  <span style={styles.metaBadge('#78909c', 'rgba(96, 125, 139, 0.2)')}>
                    📦 {relatedGearItem.description} #{String(relatedGearItem.display_id || '0000').padStart(4, '0')}
                  </span>
                )}

                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
