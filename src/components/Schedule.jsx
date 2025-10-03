import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';

export default function Schedule({ locationColors }) {
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
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return { name: 'Unknown', color: '#95a5a6', emoji: '' };
    return {
      name: location.name,
      color: location.color,
      emoji: location.emoji || ''
    };
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
    setEditForm({
      location_id: perf.location_id,
      date: perf.date,
      time: perf.time
    });
  };

  const handleCancelEdit = () => {
    setEditingPerf(null);
    setEditForm({ location_id: '', date: '', time: '' });
  };

  const handleSaveEdit = async (perfId) => {
    if (!editForm.location_id || !editForm.date || !editForm.time) {
      setMessage('❌ All fields are required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.performances.update(perfId, {
        location_id: parseInt(editForm.location_id),
        date: editForm.date,
        time: editForm.time
      });

      setMessage('✓ Performance updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      setEditingPerf(null);
      loadData();
    } catch (error) {
      console.error('Error updating performance:', error);
      setMessage('❌ Error updating performance');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (perfId, bandName) => {
    const confirmed = window.confirm(`Are you sure you want to delete this performance for ${bandName}?`);

    if (confirmed) {
      try {
        await db.performances.delete(perfId);
        setMessage('✓ Performance deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        loadData();
      } catch (error) {
        console.error('Error deleting performance:', error);
        setMessage('❌ Error deleting performance');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const filteredPerformances = getFilteredPerformances();
  const groupedPerformances = groupByBand(filteredPerformances);
  const uniqueDates = [...new Set(performances.map(p => p.date))].sort();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Performance Schedule</h2>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: message.includes('❌') ? '#ffebee' : '#e8f5e9',
          color: message.includes('❌') ? '#c62828' : '#2e7d32',
          borderRadius: '5px',
          border: `1px solid ${message.includes('❌') ? '#ef5350' : '#66bb6a'}`
        }}>
          {message}
        </div>
      )}

      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong>Filter by:</strong>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button
            onClick={() => {
              setFilterType('all');
              setFilterValue('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: filterType === 'all' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'all' ? 'bold' : 'normal'
            }}
          >
            Show All
          </button>
          <button
            onClick={() => {
              setFilterType('date');
              setFilterValue('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: filterType === 'date' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'date' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'date' ? 'bold' : 'normal'
            }}
          >
            By Date
          </button>
          <button
            onClick={() => {
              setFilterType('stage');
              setFilterValue('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: filterType === 'stage' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'stage' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'stage' ? 'bold' : 'normal'
            }}
          >
            By Stage
          </button>
          <button
            onClick={() => {
              setFilterType('band');
              setFilterValue('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: filterType === 'band' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'band' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'band' ? 'bold' : 'normal'
            }}
          >
            By Band
          </button>
        </div>

        {filterType === 'date' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select a date...</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        )}

        {filterType === 'stage' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select a stage...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.emoji ? `${loc.emoji} ` : ''}{loc.name}
              </option>
            ))}
          </select>
        )}

        {filterType === 'band' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select a band...</option>
            {bands.map(band => (
              <option key={band} value={band}>{band}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{
        padding: '10px 15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        marginBottom: '15px'
      }}>
        <strong>Total Performances:</strong> {filteredPerformances.length}
        {filterType !== 'all' && ` (filtered from ${performances.length})`}
      </div>

      {Object.keys(groupedPerformances).length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}>
          <p style={{ fontSize: '18px', color: '#999' }}>
            No performances scheduled
            {filterType !== 'all' && ' matching your filter'}
          </p>
        </div>
      ) : (
        Object.entries(groupedPerformances).map(([bandName, perfs]) => (
          <div key={bandName} style={{ marginBottom: '30px' }}>
            <h3 style={{
              padding: '10px 15px',
              backgroundColor: '#0066cc',
              color: 'white',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              {bandName} ({perfs.length} performance{perfs.length !== 1 ? 's' : ''})
            </h3>

            {perfs.map(perf => {
              const locationInfo = getLocationInfo(perf.location_id);
              const isEditing = editingPerf === perf.id;

              return (
                <div
                  key={perf.id}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: 'white',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                >
                  {isEditing ? (
                    <div>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                            Stage/Location
                          </label>
                          <select
                            value={editForm.location_id}
                            onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px',
                              fontSize: '14px',
                              borderRadius: '5px',
                              border: '1px solid #ddd'
                            }}
                          >
                            <option value="">Select location...</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>
                                {loc.emoji ? `${loc.emoji} ` : ''}{loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                            Date
                          </label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px',
                              fontSize: '14px',
                              borderRadius: '5px',
                              border: '1px solid #ddd'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                            Time
                          </label>
                          <input
                            type="time"
                            value={editForm.time}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px',
                              fontSize: '14px',
                              borderRadius: '5px',
                              border: '1px solid #ddd'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleSaveEdit(perf.id)}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '5px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              backgroundColor: locationInfo.color,
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              marginRight: '10px'
                            }}
                          >
                            {locationInfo.emoji && `${locationInfo.emoji} `}{locationInfo.name}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {formatDate(perf.date)}
                          </span>
                          <span style={{ fontSize: '16px', marginLeft: '10px' }}>
                            {formatTime(perf.time)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleEdit(perf)}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(perf.id, bandName)}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}