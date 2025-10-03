import { useState, useEffect } from 'react';
import { db } from '../db';

export default function LocationManager({ onUpdate }) {
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', color: '#0066cc', emoji: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', color: '#0066cc', emoji: '' });
  const [message, setMessage] = useState('');

  const colorPresets = [
    { name: 'Red', value: '#e74c3c' },
    { name: 'Blue', value: '#3498db' },
    { name: 'Orange', value: '#f39c12' },
    { name: 'Green', value: '#2ecc71' },
    { name: 'Purple', value: '#9b59b6' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Yellow', value: '#f1c40f' },
    { name: 'Teal', value: '#1abc9c' },
    { name: 'Gray', value: '#95a5a6' }
  ];

  const emojiPresets = [
    '🎸', '🎤', '🎧', '🎵', '🎶', '🎹', '🥁', '🎺', '🎷', '🎻',
    '📦', '🏠', '🚚', '📋', '🎪', '🎭', '🎬', '🎨', '⭐', '✨',
    '🔥', '💡', '🎯', '🎲', '🎰', '🎮', '🕹️', '🎳', '🏆', '🥇'
  ];

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const locs = await db.locations.toArray();
    setLocations(locs);
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      setMessage('❌ Location name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.locations.add({
        name: newLocation.name.trim(),
        type: 'custom',
        color: newLocation.color,
        emoji: newLocation.emoji
      });

      setMessage('✓ Location added successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      setNewLocation({ name: '', color: '#0066cc', emoji: '' });
      setShowAddForm(false);
      loadLocations();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('❌ Error adding location');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startEdit = (location) => {
    setEditingId(location.id);
    setEditForm({
      name: location.name,
      color: location.color,
      emoji: location.emoji || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', color: '#0066cc', emoji: '' });
  };

  const saveEdit = async (id) => {
    if (!editForm.name.trim()) {
      setMessage('❌ Location name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.locations.update(id, {
        name: editForm.name.trim(),
        color: editForm.color,
        emoji: editForm.emoji
      });

      setMessage('✓ Location updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      setEditingId(null);
      loadLocations();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('❌ Error updating location');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteLocation = async (id) => {
    const gearAtLocation = await db.gear.where('current_location_id').equals(id).count();
    const performancesAtLocation = await db.performances.where('location_id').equals(id).count();

    let warningMessage = 'Are you sure you want to delete this location?';
    
    if (gearAtLocation > 0 || performancesAtLocation > 0) {
      warningMessage = `WARNING: This location has ${gearAtLocation} gear item(s) and ${performancesAtLocation} scheduled performance(s).\n\nDeleting this location will:\n- Remove location from all gear items\n- Delete all performances at this location\n\nAre you sure you want to continue?`;
    }

    const confirmed = window.confirm(warningMessage);
    
    if (confirmed) {
      try {
        await db.gear.where('current_location_id').equals(id).modify({ current_location_id: null });
        await db.performances.where('location_id').equals(id).delete();
        await db.locations.delete(id);

        setMessage('✓ Location deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        
        loadLocations();
        
        if (onUpdate) onUpdate();
      } catch (error) {
        setMessage('❌ Error deleting location');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Manage Locations</h2>

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

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '15px 30px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '30px'
          }}
        >
          + Add New Location
        </button>
      )}

      {showAddForm && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px',
          marginBottom: '30px',
          border: '2px solid #0066cc'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Add New Location</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Location Name
            </label>
            <input
              type="text"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              placeholder="e.g., Main Stage, Backstage Area"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Emoji (Optional)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {emojiPresets.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setNewLocation({ ...newLocation, emoji: emoji })}
                  style={{
                    width: '45px',
                    height: '45px',
                    fontSize: '24px',
                    backgroundColor: newLocation.emoji === emoji ? '#e3f2fd' : 'white',
                    border: newLocation.emoji === emoji ? '2px solid #0066cc' : '1px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setNewLocation({ ...newLocation, emoji: '' })}
                style={{
                  width: '45px',
                  height: '45px',
                  fontSize: '20px',
                  backgroundColor: newLocation.emoji === '' ? '#e3f2fd' : 'white',
                  border: newLocation.emoji === '' ? '2px solid #0066cc' : '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: '#999'
                }}
                title="No emoji"
              >
                ∅
              </button>
            </div>
            <input
              type="text"
              value={newLocation.emoji}
              onChange={(e) => setNewLocation({ ...newLocation, emoji: e.target.value })}
              placeholder="Or type/paste any emoji"
              maxLength="2"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '24px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {colorPresets.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setNewLocation({ ...newLocation, color: preset.value })}
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: preset.value,
                    border: newLocation.color === preset.value ? '3px solid #000' : '2px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title={preset.name}
                >
                  {newLocation.color === preset.value && (
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'normal' }}>Custom:</label>
              <input
                type="color"
                value={newLocation.color}
                onChange={(e) => setNewLocation({ ...newLocation, color: e.target.value })}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <span style={{ padding: '5px 10px', backgroundColor: newLocation.color, color: '#fff', borderRadius: '3px' }}>
                {newLocation.color}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAddLocation}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Save Location
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewLocation({ name: '', color: '#0066cc', emoji: '' });
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: '15px' }}>Current Locations ({locations.length})</h3>
        {locations.map(location => (
          <div
            key={location.id}
            style={{
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: '#fff',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          >
            {editingId === location.id ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                    Emoji
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {emojiPresets.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setEditForm({ ...editForm, emoji: emoji })}
                        style={{
                          width: '40px',
                          height: '40px',
                          fontSize: '20px',
                          backgroundColor: editForm.emoji === emoji ? '#e3f2fd' : 'white',
                          border: editForm.emoji === emoji ? '2px solid #0066cc' : '1px solid #ddd',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => setEditForm({ ...editForm, emoji: '' })}
                      style={{
                        width: '40px',
                        height: '40px',
                        fontSize: '18px',
                        backgroundColor: editForm.emoji === '' ? '#e3f2fd' : 'white',
                        border: editForm.emoji === '' ? '2px solid #0066cc' : '1px solid #ddd',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        color: '#999'
                      }}
                      title="No emoji"
                    >
                      ∅
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editForm.emoji}
                    onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                    placeholder="Or type/paste any emoji"
                    maxLength="2"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '20px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      boxSizing: 'border-box',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                    Color
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {colorPresets.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => setEditForm({ ...editForm, color: preset.value })}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: preset.value,
                          border: editForm.color === preset.value ? '3px solid #000' : '2px solid #ddd',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        title={preset.name}
                      >
                        {editForm.color === preset.value && (
                          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px' }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px' }}>Custom:</label>
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      style={{ width: '50px', height: '35px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', padding: '3px 8px', backgroundColor: editForm.color, color: '#fff', borderRadius: '3px' }}>
                      {editForm.color}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => saveEdit(location.id)}
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
                    onClick={cancelEdit}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: location.color,
                      borderRadius: '5px',
                      border: '2px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}
                  >
                    {location.emoji || ''}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {location.emoji ? `${location.emoji} ` : ''}{location.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Color: {location.color}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => startEdit(location)}
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
                    Edit
                  </button>
                  <button
                    onClick={() => deleteLocation(location.id)}
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
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}