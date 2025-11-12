import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { generateQRCode } from '../utils/qrCode';
import { normalizeBandName } from '../utils/bandNormalization';

const INSTRUMENTS = [
  { label: 'Guitar', emoji: '🎸' },
  { label: 'Bass Guitar', emoji: '🎸' },
  { label: 'Drum Kit', emoji: '🥁' },
  { label: 'Keyboard', emoji: '🎹' },
  { label: 'Microphone', emoji: '🎤' },
  { label: 'Amplifier', emoji: '🔊' },
  { label: 'Pedal Board', emoji: '🎛️' },
  { label: 'Synthesizer', emoji: '🎹' },
  { label: 'DJ Equipment', emoji: '🎧' },
  { label: 'Mixer', emoji: '🎚️' },
  { label: 'Speakers', emoji: '🔊' },
  { label: 'Monitor', emoji: '📺' },
  { label: 'Other', emoji: '📦' }
];

export default function RegisterGear({ onDataChange }) {
  const db = useDatabase();
  const [bandName, setBandName] = useState('');
  const [items, setItems] = useState([{ description: '', initialLocation: '' }]);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [message, setMessage] = useState('');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bandSuggestions, setBandSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [registeredBands, setRegisteredBands] = useState([]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState({}); // { "Guitar": 2, "Drum Kit": 1 }
  const [customDescription, setCustomDescription] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      const locs = await db.locations.toArray();
      setLocations(locs);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, [db]);

  const loadBands = useCallback(async () => {
    try {
      // Try to load from band registry first
      let bands = await db.bands.toArray();

      // If no bands in registry, fall back to gear items
      if (bands.length === 0) {
        const gear = await db.gear.toArray();
        const uniqueBands = [...new Set(gear.map(g => g.band_id))];
        setRegisteredBands(uniqueBands.sort());
      } else {
        // Sort: schedule bands first, then manual
        bands.sort((a, b) => {
          if (a.source === 'schedule' && b.source !== 'schedule') return -1;
          if (a.source !== 'schedule' && b.source === 'schedule') return 1;
          return a.name.localeCompare(b.name);
        });

        setRegisteredBands(bands);
      }
    } catch (error) {
      console.error('Error loading bands:', error);
    }
  }, [db]);

  useEffect(() => {
    loadLocations();
    loadBands();
  }, [loadLocations, loadBands]);

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

  const handleBandNameChange = (value) => {
    setBandName(value);

    if (value.trim() === '') {
      // Show all bands when field is empty
      setBandSuggestions(registeredBands);
      setShowSuggestions(true);
    } else {
      const normalized = normalizeBandName(value);

      // Filter bands by normalized name
      const suggestions = registeredBands.filter(band => {
        const bandName = typeof band === 'string' ? band : band.name;
        const bandNormalized = normalizeBandName(bandName);
        return bandNormalized.includes(normalized);
      });

      setBandSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    }
  };

  const selectBand = (bandName) => {
    const name = typeof bandName === 'string' ? bandName : bandName.name;
    setBandName(name);
    setShowSuggestions(false);
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
      // Add to band registry if new
      const existingBand = await db.bands
        .where('name_normalized', '==', normalizeBandName(bandName))
        .toArray();

      if (existingBand.length === 0) {
        await db.bands.add({
          name: bandName.trim(),
          name_normalized: normalizeBandName(bandName),
          created_at: new Date(),
          source: 'manual'
        });
      }

      const registered = [];

      for (const item of validItems) {
        const gearId = await db.gear.add({
          band_id: bandName.trim(),
          band_id_normalized: normalizeBandName(bandName),
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
    suggestionsDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: '#1a1a1a',
      border: '2px solid #ffa500',
      borderRadius: '4px',
      marginTop: '4px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    },
    suggestionItem: {
      padding: '12px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #3a3a3a',
      color: '#e0e0e0',
      fontSize: '14px',
      transition: 'background 0.2s'
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

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <label style={styles.label}>Band Name</label>
            <input
              type="text"
              value={bandName}
              onChange={(e) => handleBandNameChange(e.target.value)}
              onFocus={() => {
                if (bandName.trim() === '') {
                  setBandSuggestions(registeredBands);
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(bandSuggestions.length > 0);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Click to see all bands..."
              style={styles.input}
            />

            {showSuggestions && bandSuggestions.length > 0 && (
              <div style={styles.suggestionsDropdown}>
                {bandSuggestions.map((band, idx) => {
                  const isObject = typeof band === 'object';
                  const bandName = isObject ? band.name : band;
                  const source = isObject ? band.source : 'manual';

                  return (
                    <div
                      key={idx}
                      onClick={() => selectBand(band)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d2d'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      style={styles.suggestionItem}
                    >
                      <span>
                        {source === 'schedule' ? '📅 ' : '👤 '}
                        {bandName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Select Items */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Items (Multi-Select)</label>
            <div
              onClick={() => {
                setShowInstrumentModal(true);
                setShowCustomInput(false);
                setCustomDescription('');
                setSelectedInstruments({});
              }}
              style={{
                ...styles.input,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
                minHeight: '44px'
              }}
            >
              <span style={{ color: items.length > 0 && items[0].description ? '#e0e0e0' : '#888' }}>
                {items.length > 0 && items.some(i => i.description)
                  ? `${items.filter(i => i.description).length} item(s) selected`
                  : 'Click to select instruments...'}
              </span>
              <span style={{ color: '#ffa500' }}>▼</span>
            </div>

            {/* Show selected items */}
            {items.length > 0 && items.some(i => i.description) && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #3a3a3a'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: '#ffa500',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Selected Items:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {items.filter(i => i.description).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: '#2d2d2d',
                        border: '1px solid #ffa500',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{item.description}</span>
                      <button
                        onClick={() => {
                          const newItems = items.filter((_, i) => i !== idx);
                          setItems(newItems.length > 0 ? newItems : [{ description: '', initialLocation: '' }]);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0 4px',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Initial Location for ALL items */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Initial Location (for all items) *</label>
            <select
              value={items[0]?.initialLocation || ''}
              onChange={(e) => {
                const newItems = items.map(item => ({
                  ...item,
                  initialLocation: e.target.value
                }));
                setItems(newItems);
              }}
              style={styles.input}
              required
            >
              <option value="">Select location... *</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

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

      {/* Instrument Selection Modal */}
      {showInstrumentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => {
            setShowInstrumentModal(false);
            setShowCustomInput(false);
            setCustomDescription('');
          }}
        >
          <div
            style={{
              background: '#2d2d2d',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '2px solid #ffa500'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #3a3a3a'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffa500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Select Instrument
              </h3>
            </div>

            {!showCustomInput ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {INSTRUMENTS.map((instrument) => {
                    const quantity = selectedInstruments[instrument.label] || 0;
                    const isSelected = quantity > 0;
                    return (
                      <div
                        key={instrument.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          background: isSelected ? '#2a2a2a' : '#1a1a1a',
                          border: `2px solid ${isSelected ? '#ffa500' : '#3a3a3a'}`,
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          minHeight: '100px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#ffa500';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#3a3a3a';
                          }
                        }}
                      >
                        <button
                          onClick={() => {
                            if (instrument.label === 'Other') {
                              setShowCustomInput(true);
                            } else {
                              setSelectedInstruments(prev => ({
                                ...prev,
                                [instrument.label]: (prev[instrument.label] || 0) + 1
                              }));
                            }
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px 16px 8px 16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#e0e0e0',
                            fontWeight: '600'
                          }}
                        >
                          <span style={{ fontSize: '32px', marginBottom: '8px' }}>
                            {instrument.emoji}
                          </span>
                          <span style={{ fontSize: '13px', textAlign: 'center', lineHeight: '1.2' }}>
                            {instrument.label}
                          </span>
                        </button>

                        {isSelected && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px',
                            background: '#1a1a1a',
                            borderTop: '1px solid #3a3a3a'
                          }}>
                            <button
                              onClick={() => {
                                setSelectedInstruments(prev => {
                                  const newQty = (prev[instrument.label] || 1) - 1;
                                  if (newQty <= 0) {
                                    const { [instrument.label]: _, ...rest } = prev;
                                    return rest;
                                  }
                                  return { ...prev, [instrument.label]: newQty };
                                });
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                background: '#2d2d2d',
                                border: '1px solid #ffa500',
                                color: '#ffa500',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                              }}
                            >
                              -
                            </button>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#ffa500',
                              minWidth: '24px',
                              textAlign: 'center'
                            }}>
                              {quantity}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedInstruments(prev => ({
                                  ...prev,
                                  [instrument.label]: (prev[instrument.label] || 0) + 1
                                }));
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                background: '#ffa500',
                                border: 'none',
                                color: '#1a1a1a',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => {
                      const totalQty = Object.values(selectedInstruments).reduce((sum, qty) => sum + qty, 0);
                      if (totalQty > 0) {
                        // Create items array with quantities
                        const newItems = [];
                        Object.entries(selectedInstruments).forEach(([description, quantity]) => {
                          for (let i = 0; i < quantity; i++) {
                            newItems.push({
                              description: description,
                              initialLocation: items[0]?.initialLocation || ''
                            });
                          }
                        });
                        setItems(newItems);
                        setShowInstrumentModal(false);
                        setSelectedInstruments({});
                      }
                    }}
                    disabled={Object.keys(selectedInstruments).length === 0}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: Object.keys(selectedInstruments).length > 0 ? '#ffa500' : '#555',
                      color: Object.keys(selectedInstruments).length > 0 ? '#1a1a1a' : '#888',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: Object.keys(selectedInstruments).length > 0 ? 'pointer' : 'not-allowed',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    {(() => {
                      const totalQty = Object.values(selectedInstruments).reduce((sum, qty) => sum + qty, 0);
                      return totalQty > 0 ? `Add ${totalQty} Item(s)` : 'Add Items';
                    })()}
                  </button>
                  <button
                    onClick={() => {
                      setShowInstrumentModal(false);
                      setSelectedInstruments({});
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#2d2d2d',
                      color: '#ffa500',
                      border: '2px solid #ffa500',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffa500'
                }}>
                  Custom Item Description
                </label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Enter custom item description..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '2px solid #664400',
                    backgroundColor: '#1a1a1a',
                    color: '#e0e0e0',
                    boxSizing: 'border-box',
                    marginBottom: '16px'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => {
                      if (customDescription.trim()) {
                        setSelectedInstruments(prev => ({
                          ...prev,
                          [customDescription.trim()]: (prev[customDescription.trim()] || 0) + 1
                        }));
                        setShowCustomInput(false);
                        setCustomDescription('');
                      }
                    }}
                    disabled={!customDescription.trim()}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: customDescription.trim() ? '#ffa500' : '#555',
                      color: customDescription.trim() ? '#1a1a1a' : '#888',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: customDescription.trim() ? 'pointer' : 'not-allowed',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Add Custom Item
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomDescription('');
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#2d2d2d',
                      color: '#ffa500',
                      border: '2px solid #ffa500',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}