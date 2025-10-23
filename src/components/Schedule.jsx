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
    const location = locations.find(loc => loc.id === locationId);
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
      setMessage('⚠️ All fields are required');
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
      setMessage('⚠️ Error updating performance');
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
        setMessage('⚠️ Error deleting performance');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const filteredPerformances = getFilteredPerformances();
  const groupedPerformances = groupByBand(filteredPerformances);
  const uniqueDates = [...new Set(performances.map(p => p.date))].sort();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '24px', 
          fontSize: '26px', 
          color: '#1a1a1a',
          fontWeight: '700'
        }}>
          Performance Schedule
        </h2>

        {message && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            background: message.includes('⚠️') ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            {message}
          </div>
        )}

        {/* Filter Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#495057'
          }}>
            Filter by:
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => {
                setFilterType('all');
                setFilterValue('');
              }}
              style={{
                padding: '10px 20px',
                background: filterType === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                color: filterType === 'all' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: filterType === 'all' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                transition: 'all 0.2s ease'
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
                background: filterType === 'date' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                color: filterType === 'date' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: filterType === 'date' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                transition: 'all 0.2s ease'
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
                background: filterType === 'stage' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                color: filterType === 'stage' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: filterType === 'stage' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                transition: 'all 0.2s ease'
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
                background: filterType === 'band' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                color: filterType === 'band' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: filterType === 'band' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                transition: 'all 0.2s ease'
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
                padding: '12px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500'
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
                padding: '12px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500'
              }}
            >
              <option value="">Select a stage...</option>
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
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500'
              }}
            >
              <option value="">Select a band...</option>
              {bands.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          )}
        </div>

        {/* Performance Count */}
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '15px',
          fontWeight: '600',
          color: '#495057'
        }}>
          Total Performances: {filteredPerformances.length}
          {filterType !== 'all' && ` (filtered from ${performances.length})`}
        </div>
      </div>

      {/* Performances Display */}
      {Object.keys(groupedPerformances).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
          <p style={{ fontSize: '18px', color: '#999', margin: 0 }}>
            No performances scheduled
            {filterType !== 'all' && ' matching your filter'}
          </p>
        </div>
      ) : (
        Object.entries(groupedPerformances).map(([bandName, perfs]) => (
          <div key={bandName} style={{ marginBottom: '24px' }}>
            <h3 style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '16px',
              marginBottom: '12px',
              fontSize: '20px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
            }}>
              🎤 {bandName} ({perfs.length} performance{perfs.length !== 1 ? 's' : ''})
            </h3>
            {perfs.map(perf => {
              const locationInfo = getLocationInfo(perf.location_id);
              const isEditing = editingPerf === perf.id;

              return (
                <div
                  key={perf.id}
                  style={{
                    padding: '20px',
                    marginBottom: '12px',
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  {isEditing ? (
                    <div>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                            Stage/Location
                          </label>
                          <select
                            value={editForm.location_id}
                            onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              fontSize: '15px',
                              borderRadius: '10px',
                              border: '1px solid #dee2e6',
                              backgroundColor: 'white',
                              color: '#495057'
                            }}
                          >
                            <option value="">Select location...</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                            Date
                          </label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              fontSize: '15px',
                              borderRadius: '10px',
                              border: '1px solid #dee2e6',
                              backgroundColor: 'white',
                              color: '#495057'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                            Time
                          </label>
                          <input
                            type="time"
                            value={editForm.time}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              fontSize: '15px',
                              borderRadius: '10px',
                              border: '1px solid #dee2e6',
                              backgroundColor: 'white',
                              color: '#495057'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleSaveEdit(perf.id)}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(81,207,102,0.3)'
                          }}
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '10px 20px',
                            background: '#f8f9fa',
                            color: '#495057',
                            border: '1px solid #dee2e6',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              background: `linear-gradient(135deg, ${locationInfo.color} 0%, ${locationInfo.color}dd 100%)`,
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: '600',
                              boxShadow: `0 2px 6px ${locationInfo.color}40`
                            }}
                          >
                            <span>📍</span>
                            <span>{locationInfo.name}</span>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                            📅 {formatDate(perf.date)}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                            🕒 {formatTime(perf.time)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(perf)}
                          style={{
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(77,171,247,0.3)'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(perf.id, bandName)}
                          style={{
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(255,107,107,0.3)'
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