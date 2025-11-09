import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { generateQRCode } from '../utils/qrCode';

export default function RegisterGear({ onDataChange }) {
  const db = useDatabase();
  const [bandName, setBandName] = useState('');
  const [items, setItems] = useState([{ description: '', initialLocation: '' }]);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [message, setMessage] = useState('');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      const locs = await db.locations.toArray();
      setLocations(locs);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, [db]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleAddItem = () => {
    setItems([...items, { description: '', initialLocation: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleRegister = async () => {
    if (!bandName.trim()) {
      setMessage('Band name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      setMessage('At least one item description is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if all items have a location
    const itemsWithoutLocation = validItems.filter(item => !item.initialLocation);
    if (itemsWithoutLocation.length > 0) {
      setMessage('Initial location is required for all items');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const registered = [];

      for (const item of validItems) {
        const gearId = await db.gear.add({
          band_id: bandName.trim(),
          description: item.description.trim(),
          qr_code: '',
          current_location_id: item.initialLocation || null,
          status: 'active',
          missing_status: 'active',
          missing_since: null,
          missing_reported_by: null,
          missing_last_location: null,
          created_at: new Date(),
          in_transit: false,
          checked_out: false,
          lastUpdated: new Date()
        });

        const qrCode = await generateQRCode(gearId);
        await db.gear.update(gearId, { qr_code: qrCode });

        const savedItem = await db.gear.get(gearId);

        registered.push({
          id: gearId,
          band: bandName.trim(),
          description: item.description.trim(),
          qrCode: qrCode,
          display_id: savedItem.display_id
        });
      }

      setRegisteredItems(registered);
      setMessage(`${registered.length} item(s) registered successfully`);
      setTimeout(() => setMessage(''), 3000);
      onDataChange?.();
    } catch (error) {
      console.error('Error registering gear:', error);
      setMessage('Error registering items');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleReset = () => {
    setBandName('');
    setItems([{ description: '', initialLocation: '' }]);
    setRegisteredItems([]);
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
      backgroundColor: '#2d2d2d'
    },
    itemCard: {
      padding: '16px',
      backgroundColor: '#2d2d2d',
      borderRadius: '6px',
      marginBottom: '12px',
      border: '1px solid #3a3a3a'
    },
    itemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    itemNumber: {
      color: '#ffa500',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    removeBtn: {
      padding: '8px 16px',
      backgroundColor: '#2d2d2d',
      color: '#ff6b6b',
      border: '2px solid #ff6b6b',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    button: {
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
      marginBottom: '10px'
    },
    buttonSecondary: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '10px'
    },
    successBox: {
      padding: '20px',
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      borderRadius: '6px',
      marginBottom: '20px',
      border: '2px solid #4caf50',
      textAlign: 'center'
    },
    successTitle: {
      color: '#4caf50',
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    previewItem: {
      padding: '8px',
      marginBottom: '8px',
      backgroundColor: '#1a1a1a',
      borderRadius: '4px',
      border: '1px solid #3a3a3a',
      color: '#e0e0e0',
      fontSize: '14px',
      textAlign: 'left'
    }
  };

  return (
    <div>
      {registeredItems.length === 0 ? (
        <div>
          <div style={styles.pageTitle}>Register New Gear</div>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Band Name</label>
            <input
              type="text"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Enter band name"
              style={styles.input}
            />
          </div>

          {items.map((item, index) => (
            <div key={index} style={styles.itemCard}>
              <div style={styles.itemHeader}>
                <div style={styles.itemNumber}>Item {index + 1}</div>
                {items.length > 1 && (
                  <button onClick={() => handleRemoveItem(index)} style={styles.removeBtn}>
                    Remove
                  </button>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Item Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="e.g. Guitar, Drum Kit"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Initial Location *</label>
                <select
                  value={item.initialLocation}
                  onChange={(e) => handleItemChange(index, 'initialLocation', e.target.value)}
                  style={styles.input}
                  required
                >
                  <option value="">Select location... *</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={handleRegister}
            disabled={isLoading}
            style={{
              ...styles.button,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '⏳ Registering...' : '✓ Register & Print QR'}
          </button>

          <button onClick={handleAddItem} style={styles.buttonSecondary}>
            + Add Another Item
          </button>
        </div>
      ) : (
        <div>
          <div style={styles.successBox}>
            <div style={styles.successTitle}>✓ {registeredItems.length} Item(s) Registered</div>
            {registeredItems.map(item => (
              <div key={item.id} style={styles.previewItem}>
                <strong>{item.band}</strong> - {item.description}
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  #{String(item.display_id || '0000').padStart(4, '0')}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handlePrint} style={styles.button}>
            🖨️ Print All Labels
          </button>

          <button onClick={handleReset} style={styles.buttonSecondary}>
            + Register More Items
          </button>

          <div className="print-only">
            {registeredItems.map(item => (
              <div key={item.id} className="print-label-small">
                <img
                  src={item.qrCode}
                  alt={`QR Code for ${item.description}`}
                  style={{
                    width: '50mm',
                    height: '50mm',
                    display: 'block',
                    margin: '0 auto 3mm auto'
                  }}
                />
                <div style={{
                  fontSize: '6.5mm',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5mm',
                  marginBottom: '3mm',
                  textAlign: 'center'
                }}>
                  {item.band}
                </div>
                <div style={{
                  fontSize: '4.5mm',
                  marginBottom: '2mm',
                  textAlign: 'center'
                }}>
                  {item.description}
                </div>
                <div style={{
                  fontSize: '3mm',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  #{String(item.display_id || '0000').padStart(4, '0')}
                </div>
              </div>
            ))}
          </div>

          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              
              .print-only, .print-only * {
                visibility: visible;
              }
              
              .print-only {
                position: absolute;
                left: 0;
                top: 0;
              }

              @page {
                size: A4;
                margin: 8mm;
              }

              .print-label-small {
                display: inline-block;
                width: 90mm;
                padding: 5mm;
                margin: 2mm;
                box-sizing: border-box;
                vertical-align: top;
                page-break-inside: avoid;
              }
            }

            @media screen {
              .print-only {
                display: none !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}