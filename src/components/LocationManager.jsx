import { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';

export default function LocationManager({ onUpdate }) {
  const db = useDatabase();
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', color: '#4caf50' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', color: '#4caf50' });
  const [message, setMessage] = useState('');

  const colorPresets = [
    { name: 'Green', value: '#4caf50' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Red', value: '#e74c3c' },
    { name: 'Purple', value: '#9b59b6' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Yellow', value: '#f1c40f' },
    { name: 'Teal', value: '#1abc9c' },
    { name: 'Gray', value: '#95a5a6' }
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
      setMessage('Location name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.locations.add({
        name: newLocation.name.trim(),
        type: 'custom',
        color: newLocation.color,
        emoji: ''
      });

      setMessage('Location added successfully');
      setTimeout(() => setMessage(''), 3000);
      
      setNewLocation({ name: '', color: '#4caf50' });
      setShowAddForm(false);
      loadLocations();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('Error adding location');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startEdit = (location) => {
    setEditingId(location.id);
    setEditForm({
      name: location.name,
      color: location.color
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setEditForm({ name: '', color: '#4caf50' });
  };

  const saveEdit = async (id) => {
    if (!editForm.name.trim()) {
      setMessage('Location name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await db.locations.update(id, {
        name: editForm.name.trim(),
        color: editForm.color
      });

      setMessage('Location updated successfully');
      setTimeout(() => setMessage(''), 3000);
      
      setEditingId(null);
      loadLocations();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage('Error updating location');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteLocation = async (id) => {
    const gearAtLocation = await db.gear.where('current_location_id', '==', id).count();
    const performancesAtLocation = await db.performances.where('location_id', '==', id).count();

    let warningMessage = 'Are you sure you want to delete this location?';

    if (gearAtLocation > 0 || performancesAtLocation > 0) {
      warningMessage = `WARNING: This location has ${gearAtLocation} gear item(s) and ${performancesAtLocation} scheduled performance(s).\n\nDeleting will remove location from all gear items and delete all performances.\n\nContinue?`;
    }

    const confirmed = window.confirm(warningMessage);

    if (confirmed) {
      try {
        await db.gear.where('current_location_id', '==', id).modify({ current_location_id: null });
        await db.performances.where('location_id', '==', id).delete();
        await db.locations.delete(id);

        setMessage('Location deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        
        loadLocations();
        
        if (onUpdate) onUpdate();
      } catch (error) {
        setMessage('Error deleting location');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const styles = {
    pageTitle: {
      marginBottom: '20px',
      textAlign: 'center',
      color: '#ffa500',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    message: {
      padding: '15px',
      marginBottom: '20px',
      backgroundColor: message.includes('Error') || message.includes('required') ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
      color: message.includes('Error') || message.includes('required') ? '#ff6b6b' : '#4caf50',
      borderRadius: '6px',
      border: `2px solid ${message.includes('Error') || message.includes('required') ? '#f44336' : '#4caf50'}`,
      fontSize: '14px',
      fontWeight: '600'
    },
    locationCard: (color) => ({
      background: '#2d2d2d',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderLeft: `4px solid ${color}`
    }),
    locationName: {
      color: '#ffa500',
      fontSize: '15px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    locationActions: {
      display: 'flex',
      gap: '8px'
    },
    iconBtn: {
      width: '36px',
      height: '36px',
      background: '#3a3a3a',
      border: 'none',
      borderRadius: '4px',
      color: '#ffa500',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    addBtn: {
      width: '100%',
      padding: '14px',
      background: '#2d2d2d',
      border: '2px dashed #ffa500',
      borderRadius: '6px',
      color: '#ffa500',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    editForm: {
      padding: '20px',
      backgroundColor: '#2d2d2d',
      borderRadius: '6px',
      marginBottom: '16px',
      border: '2px solid #ffa500',
      borderLeft: '4px solid #ffa500'
    },
    formTitle: {
      marginTop: 0,
      marginBottom: '20px',
      color: '#ffa500',
      fontSize: '16px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '700',
      color: '#ffa500',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      boxSizing: 'border-box',
      color: '#e0e0e0',
      backgroundColor: '#1a1a1a'
    },
    colorGrid: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '10px'
    },
    colorButton: (color, isSelected) => ({
      width: '40px',
      height: '40px',
      backgroundColor: color,
      border: isSelected ? '3px solid #ffa500' : '2px solid #3a3a3a',
      borderRadius: '5px',
      cursor: 'pointer',
      position: 'relative'
    }),
    buttonRow: {
      display: 'flex',
      gap: '10px'
    },
    saveButton: {
      padding: '12px 24px',
      backgroundColor: '#4caf50',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    cancelButton: {
      padding: '12px 24px',
      backgroundColor: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  };

  return (
    <div className="component-content">
      <div style={styles.pageTitle}>Manage Locations</div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div style={styles.editForm}>
          <h3 style={styles.formTitle}>Add New Location</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Location Name</label>
            <input
              type="text"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              placeholder="e.g., Main Stage"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Color</label>
            <div style={styles.colorGrid}>
              {colorPresets.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setNewLocation({ ...newLocation, color: preset.value })}
                  style={styles.colorButton(preset.value, newLocation.color === preset.value)}
                  title={preset.name}
                >
                  {newLocation.color === preset.value && (
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px', color: '#fff' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button onClick={handleAddLocation} style={styles.saveButton}>
              Save
            </button>
            <button onClick={cancelEdit} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Location List */}
      {locations.map(location => (
        editingId === location.id ? (
          <div key={location.id} style={styles.editForm}>
            <h3 style={styles.formTitle}>Edit Location</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Location Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Color</label>
              <div style={styles.colorGrid}>
                {colorPresets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setEditForm({ ...editForm, color: preset.value })}
                    style={styles.colorButton(preset.value, editForm.color === preset.value)}
                    title={preset.name}
                  >
                    {editForm.color === preset.value && (
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px', color: '#fff' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button onClick={() => saveEdit(location.id)} style={styles.saveButton}>
                Save
              </button>
              <button onClick={cancelEdit} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div key={location.id} style={styles.locationCard(location.color)}>
            <div style={styles.locationName}>
              {location.name}
            </div>
            <div style={styles.locationActions}>
              <button onClick={() => startEdit(location)} style={styles.iconBtn}>
                ✏️
              </button>
              <button onClick={() => deleteLocation(location.id)} style={styles.iconBtn}>
                🗑️
              </button>
            </div>
          </div>
        )
      ))}

      {/* Add Button */}
      {!showAddForm && !editingId && (
        <button onClick={() => setShowAddForm(true)} style={styles.addBtn}>
          + Add New Location
        </button>
      )}
    </div>
  );
}