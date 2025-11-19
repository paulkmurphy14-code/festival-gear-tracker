import { useState, useEffect } from 'react';

const CONTAINER_PRESETS = {
  'cargo_van': { name: 'Cargo Van', realLength: 8, realWidth: 5, gridLength: 8, gridWidth: 5, height: 3, desc: '8ft × 5ft × 6ft' },
  'sprinter_van': { name: 'Sprinter Van', realLength: 12, realWidth: 6, gridLength: 12, gridWidth: 6, height: 3, desc: '12ft × 6ft × 6ft' },
  'small_truck': { name: '10ft Box Truck', realLength: 10, realWidth: 6, gridLength: 10, gridWidth: 6, height: 4, desc: '10ft × 6ft × 8ft' },
  'medium_truck': { name: '16ft Box Truck', realLength: 16, realWidth: 7, gridLength: 16, gridWidth: 7, height: 4, desc: '16ft × 7ft × 8ft' },
  'large_truck': { name: '20ft Box Truck', realLength: 20, realWidth: 8, gridLength: 20, gridWidth: 8, height: 5, desc: '20ft × 8ft × 10ft' },
  'semi_trailer': { name: '40ft Semi Trailer', realLength: 40, realWidth: 8, gridLength: 40, gridWidth: 8, height: 5, desc: '40ft × 8ft × 10ft' },
  'custom': { name: 'Custom Size', realLength: null, realWidth: null, gridLength: 10, gridWidth: 8, height: 3, desc: 'Manual entry' }
};

export default function ContainerConfig({ locations = [], onClose, onSave, editingContainer = null }) {
  const [presetType, setPresetType] = useState('custom');
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(8);
  const [containerHeight, setContainerHeight] = useState(3);
  const [realLength, setRealLength] = useState(null);
  const [realWidth, setRealWidth] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (editingContainer) {
      setPresetType(editingContainer.preset_type || 'custom');
      setName(editingContainer.name || '');
      setLocationId(editingContainer.location_id || '');
      setLength(editingContainer.length || 10);
      setWidth(editingContainer.width || 8);
      setContainerHeight(editingContainer.container_height || 3);
      setRealLength(editingContainer.real_length || null);
      setRealWidth(editingContainer.real_width || null);
    }
  }, [editingContainer]);

  // Handle preset selection
  const handlePresetChange = (preset) => {
    setPresetType(preset);
    if (preset !== 'custom') {
      const presetData = CONTAINER_PRESETS[preset];
      setLength(presetData.gridLength);
      setWidth(presetData.gridWidth);
      setContainerHeight(presetData.height);
      setRealLength(presetData.realLength);
      setRealWidth(presetData.realWidth);
      // Auto-fill name if empty
      if (!name) {
        setName(presetData.name);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage('Container name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!locationId) {
      setMessage('Please select a stage/location');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (length < 3 || length > 50) {
      setMessage('Length must be between 3 and 50');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (width < 3 || width > 50) {
      setMessage('Width must be between 3 and 50');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    onSave({
      name: name.trim(),
      location_id: locationId,
      length: parseInt(length),
      width: parseInt(width),
      container_height: parseInt(containerHeight),
      preset_type: presetType,
      real_length: realLength,
      real_width: realWidth,
      created_at: editingContainer?.created_at || new Date(),
      created_by: editingContainer?.created_by || 'current_user'
    });
  };

  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    },
    modalCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      border: '2px solid #ffa500',
      padding: '24px'
    },
    modalTitle: {
      margin: '0 0 24px 0',
      color: '#ffa500',
      fontSize: '18px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      textAlign: 'center'
    },
    formGroup: {
      marginBottom: '20px'
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
      borderRadius: '6px',
      border: '2px solid #664400',
      backgroundColor: '#2d2d2d',
      color: '#e0e0e0',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      borderRadius: '6px',
      border: '2px solid #664400',
      backgroundColor: '#2d2d2d',
      color: '#e0e0e0',
      boxSizing: 'border-box'
    },
    helpText: {
      fontSize: '12px',
      color: '#888',
      marginTop: '4px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px'
    },
    saveButton: {
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
      color: '#888',
      border: '2px solid #444',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    message: {
      padding: '12px',
      marginBottom: '16px',
      background: 'rgba(244, 67, 54, 0.2)',
      color: '#ff6b6b',
      border: '2px solid #ff6b6b',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>
          {editingContainer ? 'Edit Container' : 'Add Container'}
        </h3>

        {message && (
          <div style={styles.message}>{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Container Type *</label>
            <select
              value={presetType}
              onChange={(e) => handlePresetChange(e.target.value)}
              style={styles.select}
              required
            >
              {Object.entries(CONTAINER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.name} {preset.desc !== 'Manual entry' && `(${preset.desc})`}
                </option>
              ))}
            </select>
            <div style={styles.helpText}>
              Select a standard container size or choose Custom
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Container Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Stage Truck, Backup Trailer"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Stage/Location *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={styles.select}
              required
            >
              <option value="">Select a stage...</option>
              {locations && locations.length > 0 ? (
                locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.emoji} {loc.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No locations available</option>
              )}
            </select>
            {locations && locations.length === 0 && (
              <div style={{...styles.helpText, color: '#ff6b6b'}}>
                No stages found. Please add stages in Location Manager first.
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Length (Front to Back) *
              {realLength && <span style={{color: '#888', fontWeight: 'normal'}}> — {realLength}ft</span>}
            </label>
            <input
              type="number"
              min="3"
              max="50"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              style={styles.input}
              required
              disabled={presetType !== 'custom'}
            />
            <div style={styles.helpText}>
              {presetType !== 'custom'
                ? `Grid size: ${length} cells (≈1 cell per foot)`
                : 'Number of grid cells from front to back (3-50)'}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Width (Left to Right) *
              {realWidth && <span style={{color: '#888', fontWeight: 'normal'}}> — {realWidth}ft</span>}
            </label>
            <input
              type="number"
              min="3"
              max="50"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              style={styles.input}
              required
              disabled={presetType !== 'custom'}
            />
            <div style={styles.helpText}>
              {presetType !== 'custom'
                ? `Grid size: ${width} cells (≈1 cell per foot)`
                : 'Number of grid cells from left to right (3-50)'}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Height (Vertical Stacking Layers) *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={containerHeight}
              onChange={(e) => setContainerHeight(e.target.value)}
              style={styles.input}
              required
              disabled={presetType !== 'custom'}
            />
            <div style={styles.helpText}>
              {presetType !== 'custom'
                ? `${containerHeight} layers (Ground + ${containerHeight - 1} stacking layers)`
                : 'Number of vertical layers for stacking items (1-10)'}
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.saveButton}>
              {editingContainer ? 'Update Container' : 'Create Container'}
            </button>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
