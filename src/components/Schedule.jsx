import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';

export default function Schedule({ locationColors }) {
  const db = useDatabase();
  const [performances, setPerformances] = useState([]);
  const [locations, setLocations] = useState([]);
  const [bands, setBands] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [editingPerf, setEditingPerf] = useState(null);
  const [editForm, setEditForm] = useState({ location_id: '', date: '', time: '' });
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const perfs = await db.performances.toArray();
      const locs = await db.locations.toArray();
      const allBands = [...new Set(perfs.map(p => p.band_id))].sort();

      setPerformances(perfs);
      setLocations(locs);
      setBands(allBands);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getLocationInfo = useCallback((locationId) => {
    const location = locations.find(loc => String(loc.id) === String(locationId));
    if (!location) return { name: 'Unknown', color: '#95a5a6' };
    return { name: location.name, color: location.color };
  }, [locations]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;

    const hours = parts[0];
    const minutes = parts[1];
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  const getFilteredPerformances = useCallback(() => {
    let filtered = [...performances];

    if (filterType === 'date' && filterValue) {
      filtered = filtered.filter(p => p.date === filterValue);
    } else if (filterType === 'stage' && filterValue) {
      filtered = filtered.filter(p => p.location_id === parseInt(filterValue));
    } else if (filterType === 'band' && filterValue) {
      filtered = filtered.filter(p => p.band_id === filterValue);
    }

    return filtered.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [performances, filterType, filterValue]);

  const groupByBand = (perfs) => {
    const grouped = {};
    perfs.forEach(perf => {
      if (!grouped[perf.band_id]) {
        grouped[perf.band_id] = [];
      }
      grouped[perf.band_id].push(perf);
    });
    return grouped;
  };

  const handleEdit = (perf) => {
    setEditingPerf(perf.id);
    setEditForm({ location_id: perf.location_id, date: perf.date, time: perf.time });
  };

  const handleCancelEdit = () => {
    setEditingPerf(null);
    setEditForm({ location_id: '', date: '', time: '' });
  };

  const handleSaveEdit = async (perfId) => {
    if (!editForm.location_id || !editForm.date || !editForm.time) {
      setMessage('All fields are required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.performances.update(perfId, {
        location_id: editForm.location_id,
        date: editForm.date,
        time: editForm.time
      });

      setMessage('Performance updated successfully');
      setTimeout(() => setMessage(''), 3000);

      setEditingPerf(null);
      loadData();
    } catch (error) {
      console.error('Error updating performance:', error);
      setMessage('Error updating performance');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (perfId, bandName) => {
    const confirmed = window.confirm(`Are you sure you want to delete this performance for ${bandName}?`);

    if (confirmed) {
      try {
        await db.performances.delete(perfId);
        setMessage('Performance deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        loadData();
      } catch (error) {
        console.error('Error deleting performance:', error);
        setMessage('Error deleting performance');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const filteredPerformances = getFilteredPerformances();
  const groupedPerformances = groupByBand(filteredPerformances);
  const uniqueDates = [...new Set(performances.map(p => p.date))].sort();

  const styles = {
    message: {
      padding: '16px',
      marginBottom: '20px',
      background: message.includes('Error') || message.includes('required') ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
      color: message.includes('Error') || message.includes('required') ? '#ff6b6b' : '#4caf50',
      borderRadius: '6px',
      border: `2px solid ${message.includes('Error') || message.includes('required') ? '#f44336' : '#4caf50'}`,
      fontSize: '14px',
      fontWeight: '600'
    },
    filterSection: {
      marginBottom: '20px'
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: '700',
      marginBottom: '12px',
      color: '#ffa500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    filterButtons: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '16px'
    },
    filterButton: (isActive) => ({
      padding: '10px 16px',
      background: isActive ? '#ffa500' : '#2d2d2d',
      color: isActive ? '#1a1a1a' : '#999',
      border: isActive ? 'none' : '1px solid #444',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'all 0.2s'
    }),
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0'
    },
    bandSection: {
      marginBottom: '24px'
    },
    bandHeader: {
      background: '#2d2d2d',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '12px',
      borderLeft: '4px solid #ffa500',
      color: '#ffa500',
      fontSize: '16px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    perfCard: {
      padding: '20px',
      marginBottom: '12px',
      background: '#2d2d2d',
      borderRadius: '6px',
      border: '1px solid #3a3a3a'
    },
    editRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '12px',
      flexWrap: 'wrap'
    },
    editField: {
      flex: 1,
      minWidth: '150px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '12px',
      fontWeight: '700',
      color: '#ffa500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '10px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0'
    },
    buttonRow: {
      display: 'flex',
      gap: '10px'
    },
    saveButton: {
      padding: '10px 20px',
      background: '#4caf50',
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
      padding: '10px 20px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    perfDisplay: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    perfInfo: {
      flex: 1,
      minWidth: '200px'
    },
    perfDetails: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
      flexWrap: 'wrap'
    },
    locationBadge: (color) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.2)`,
      color: color,
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderLeft: `4px solid ${color}`
    }),
    dateTime: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#e0e0e0'
    },
    editButton: {
      padding: '10px 16px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    deleteButton: {
      padding: '10px 16px',
      background: '#2d2d2d',
      color: '#ff6b6b',
      border: '2px solid #ff6b6b',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  };

  return (
    <div className="component-content">
      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.filterSection}>
        <div style={styles.filterLabel}>
          Filter by:
        </div>
        <div style={styles.filterButtons}>
          <button
            onClick={() => { setFilterType('all'); setFilterValue(''); }}
            style={styles.filterButton(filterType === 'all')}
          >
            All
          </button>
          <button
            onClick={() => { setFilterType('date'); setFilterValue(''); }}
            style={styles.filterButton(filterType === 'date')}
          >
            Date
          </button>
          <button
            onClick={() => { setFilterType('stage'); setFilterValue(''); }}
            style={styles.filterButton(filterType === 'stage')}
          >
            Stage
          </button>
          <button
            onClick={() => { setFilterType('band'); setFilterValue(''); }}
            style={styles.filterButton(filterType === 'band')}
          >
            Band
          </button>
        </div>

        {filterType === 'date' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={styles.select}
          >
            <option value="">Select date...</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </select>
        )}

        {filterType === 'stage' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={styles.select}
          >
            <option value="">Select stage...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        )}

        {filterType === 'band' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={styles.select}
          >
            <option value="">Select band...</option>
            {bands.map(band => (
              <option key={band} value={band}>
                {band}
              </option>
            ))}
          </select>
        )}
      </div>

      {Object.entries(groupedPerformances).map(([bandName, perfs]) => (
        <div key={bandName} style={styles.bandSection}>
          <h3 style={styles.bandHeader}>
            {bandName} ({perfs.length} performance{perfs.length !== 1 ? 's' : ''})
          </h3>
          {perfs.map(perf => {
            const locationInfo = getLocationInfo(perf.location_id);
            const isEditing = editingPerf === perf.id;

            return (
              <div
                key={perf.id}
                style={styles.perfCard}
              >
                {isEditing ? (
                  <div>
                    <div style={styles.editRow}>
                      <div style={styles.editField}>
                        <label style={styles.label}>
                          Stage/Location
                        </label>
                        <select
                          value={editForm.location_id}
                          onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                          style={styles.input}
                        >
                          <option value="">Select location...</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.editField}>
                        <label style={styles.label}>
                          Date
                        </label>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.editField}>
                        <label style={styles.label}>
                          Time
                        </label>
                        <input
                          type="time"
                          value={editForm.time}
                          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                    </div>
                    <div style={styles.buttonRow}>
                      <button
                        onClick={() => handleSaveEdit(perf.id)}
                        style={styles.saveButton}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.perfDisplay}>
                    <div style={styles.perfInfo}>
                      <div style={styles.perfDetails}>
                        <div style={styles.locationBadge(locationInfo.color)}>
                          {locationInfo.name}
                        </div>
                        <span style={styles.dateTime}>
                          {formatDate(perf.date)}
                        </span>
                        <span style={styles.dateTime}>
                          {formatTime(perf.time)}
                        </span>
                      </div>
                    </div>
                    <div style={styles.buttonRow}>
                      <button
                        onClick={() => handleEdit(perf)}
                        style={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(perf.id, bandName)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}