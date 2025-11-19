import { useState, useEffect } from 'react';

export default function StowageItemModal({
  container,
  existingItem,
  gear,
  onSave,
  onDelete,
  onClose
}) {
  const [gearId, setGearId] = useState('');
  const [itemWidth, setItemWidth] = useState(2);
  const [itemLength, setItemLength] = useState(2);
  const [layer, setLayer] = useState(0);
  const [stackHeight, setStackHeight] = useState(1);
  const [xPosition, setXPosition] = useState(25);
  const [yPosition, setYPosition] = useState(25);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existingItem) {
      setGearId(existingItem.gear_id || '');
      setItemWidth(existingItem.item_width || 2);
      setItemLength(existingItem.item_length || 2);
      setLayer(existingItem.z || 0);
      setStackHeight(existingItem.item_height || 1);
      setXPosition(existingItem.x_position || 25);
      setYPosition(existingItem.y_position || 25);
    }
  }, [existingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!gearId) {
      setMessage('Please select a gear item');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    onSave({
      gear_id: gearId,
      x_position: parseFloat(xPosition),
      y_position: parseFloat(yPosition),
      z: parseInt(layer),
      item_width: parseFloat(itemWidth),
      item_length: parseFloat(itemLength),
      item_height: parseInt(stackHeight),
      container_id: container.id,
      placed_by: 'current_user',
      placed_at: new Date()
    });
  };

  const handleDelete = () => {
    if (window.confirm('Remove this item from the stowage plan?')) {
      onDelete(existingItem);
    }
  };

  const selectedGear = gear.find(g => g.id === gearId);

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
      zIndex: 3000,
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
    positionInfo: {
      padding: '12px',
      background: '#2d2d2d',
      borderRadius: '6px',
      marginBottom: '20px',
      border: '2px solid #664400'
    },
    positionText: {
      color: '#ccc',
      fontSize: '14px',
      marginBottom: '4px'
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
    sizeGroup: {
      display: 'flex',
      gap: '12px'
    },
    sizeInput: {
      flex: 1
    },
    helpText: {
      fontSize: '12px',
      color: '#888',
      marginTop: '4px'
    },
    gearPreview: {
      padding: '12px',
      background: '#2d2d2d',
      borderRadius: '6px',
      marginTop: '12px',
      border: '2px solid #ffa500'
    },
    gearText: {
      color: '#e0e0e0',
      fontSize: '14px',
      marginBottom: '4px'
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
    deleteButton: {
      flex: 1,
      padding: '14px',
      background: '#2d2d2d',
      color: '#ff6b6b',
      border: '2px solid #ff6b6b',
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
          {existingItem ? 'Edit Item' : 'Place Item'}
        </h3>

        <div style={styles.positionInfo}>
          <div style={styles.positionText}>
            <strong>Container:</strong> {container.name}
          </div>
          <div style={styles.positionText}>
            <strong>Size:</strong> {container.real_length || container.length}ft × {container.real_width || container.width}ft
          </div>
        </div>

        {message && (
          <div style={styles.message}>{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Gear Item *</label>
            <select
              value={gearId}
              onChange={(e) => setGearId(e.target.value)}
              style={styles.select}
              required
            >
              <option value="">Select gear...</option>
              {gear.map(item => (
                <option key={item.id} value={item.id}>
                  {item.band_id} - {item.description} (#{String(item.display_id || '0000').padStart(4, '0')})
                </option>
              ))}
            </select>

            {selectedGear && (
              <div style={styles.gearPreview}>
                <div style={styles.gearText}>
                  <strong>Band:</strong> {selectedGear.band_id}
                </div>
                <div style={styles.gearText}>
                  <strong>Description:</strong> {selectedGear.description}
                </div>
                <div style={styles.gearText}>
                  <strong>ID:</strong> #{String(selectedGear.display_id || '0000').padStart(4, '0')}
                </div>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Item Dimensions (in feet)</label>
            <div style={styles.sizeGroup}>
              <div style={styles.sizeInput}>
                <label style={{ ...styles.label, fontSize: '12px' }}>Width (ft)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max={container.real_width || container.width}
                  value={itemWidth}
                  onChange={(e) => setItemWidth(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.sizeInput}>
                <label style={{ ...styles.label, fontSize: '12px' }}>Length (ft)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max={container.real_length || container.length}
                  value={itemLength}
                  onChange={(e) => setItemLength(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.helpText}>
              Width (left-right) × Length (front-back) in feet
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Position (percentage from edges)</label>
            <div style={styles.sizeGroup}>
              <div style={styles.sizeInput}>
                <label style={{ ...styles.label, fontSize: '12px' }}>From Left (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={xPosition}
                  onChange={(e) => setXPosition(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.sizeInput}>
                <label style={{ ...styles.label, fontSize: '12px' }}>From Front (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={yPosition}
                  onChange={(e) => setYPosition(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.helpText}>
              {existingItem ? 'Drag item on canvas or adjust here' : 'You can drag the item after placing it'}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Stacking Position</label>
            <div style={styles.sizeGroup}>
              <div style={styles.sizeInput}>
                <label style={{ ...styles.label, fontSize: '12px' }}>Layer</label>
                <select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value)}
                  style={styles.input}
                  required
                >
                  {Array.from({ length: container.container_height || 3 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'Ground' : `Layer ${i}`}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.sizeInput}>
                <label style={{ ...styles.label, fontSize: '12px' }}>Stack Height</label>
                <input
                  type="number"
                  min="1"
                  max={(container.container_height || 3) - parseInt(layer)}
                  value={stackHeight}
                  onChange={(e) => setStackHeight(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.helpText}>
              Which layer to place on + how many layers tall
            </div>
          </div>

          <div style={styles.buttonGroup}>
            {existingItem ? (
              <>
                <button type="submit" style={styles.saveButton}>
                  Update
                </button>
                <button type="button" onClick={handleDelete} style={styles.deleteButton}>
                  Remove
                </button>
              </>
            ) : (
              <button type="submit" style={styles.saveButton}>
                Place Item
              </button>
            )}
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
