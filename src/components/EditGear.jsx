import { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';

export default function EditGear({ item, onSave, onCancel }) {
  const db = useDatabase();
  const [description, setDescription] = useState(item.description);
  const [bandName, setBandName] = useState(item.band_id);
  const [performances, setPerformances] = useState([]);
  const [showPrintOption, setShowPrintOption] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [updatedItem, setUpdatedItem] = useState(null);
  const [message, setMessage] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadPerformances();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const locs = await db.locations.toArray();
    setLocations(locs);
  };

  const loadPerformances = async () => {
    const perfs = await db.performances.where('band_id', '==', item.band_id).toArray();
    setPerformances(perfs.map(p => ({
      id: p.id,
      location: p.location_id,
      date: p.date,
      time: p.time
    })));
  };

  const handleAddPerformance = () => {
    setPerformances([...performances, { location: '', date: '', time: '' }]);
  };

  const handleRemovePerformance = (index) => {
    const confirmed = window.confirm('Are you sure you want to remove this performance?');
    if (confirmed) {
      setPerformances(performances.filter((_, i) => i !== index));
    }
  };

  const handlePerformanceChange = (index, field, value) => {
    const updated = [...performances];
    updated[index][field] = value;
    setPerformances(updated);
  };

  const handleSave = async () => {
    if (!description.trim() || !bandName.trim()) {
      setMessage('⚠️ Band name and description are required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const oldBandName = item.band_id;

      await db.gear.update(item.id, {
        description: description.trim(),
        band_id: bandName.trim()
      });

      if (oldBandName !== bandName.trim()) {
        await db.performances.where('band_id', '==', oldBandName).modify({ band_id: bandName.trim() });
      }

      await db.performances.where('band_id', '==', bandName.trim()).delete();

      for (const perf of performances) {
        if (perf.location && perf.date && perf.time) {
          await db.performances.add({
            band_id: bandName.trim(),
            location_id: parseInt(perf.location),
            date: perf.date,
            time: perf.time
          });
        }
      }

      setMessage('✓ Item updated successfully!');

      if (showPrintOption) {
  const itemData = await db.gear.get(item.id);
  setUpdatedItem(itemData);
  setShouldPrint(true);
  const delay = /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? 2500 : 500;
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      setShouldPrint(false);
      onSave();
    }, delay);
  }, delay);
} else {
  setTimeout(() => {
    setMessage('');
    onSave();
  }, 1000);
}

    } catch (error) {
      console.error('Error updating gear:', error);
      setMessage('⚠️ Error updating item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '24px', 
          fontSize: '26px', 
          color: '#1a1a1a',
          fontWeight: '700'
        }}>
          Edit Gear Item
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

        <div className="no-print">
          {/* Band Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#495057'
            }}>
              Band Name
            </label>
            <input
              type="text"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500'
              }}
            />
          </div>

          {/* Item Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#495057'
            }}>
              Item Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500'
              }}
            />
          </div>

          {/* Performance Schedule */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <label style={{ fontSize: '16px', fontWeight: '600', color: '#495057' }}>
                Performance Schedule
              </label>
              <button
                onClick={handleAddPerformance}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #cc5de8 0%, #9c36b5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(204,93,232,0.3)'
                }}
              >
                + Add Performance
              </button>
            </div>

            {performances.map((perf, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                      Stage/Location
                    </label>
                    <select
                      value={perf.location}
                      onChange={(e) => handlePerformanceChange(index, 'location', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '15px',
                        borderRadius: '10px',
                        border: '1px solid #dee2e6',
                        backgroundColor: 'white',
                        color: '#495057',
                        fontWeight: '500'
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
                      value={perf.date}
                      onChange={(e) => handlePerformanceChange(index, 'date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '15px',
                        borderRadius: '10px',
                        border: '1px solid #dee2e6',
                        backgroundColor: 'white',
                        color: '#495057',
                        fontWeight: '500'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={perf.time}
                      onChange={(e) => handlePerformanceChange(index, 'time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '15px',
                        borderRadius: '10px',
                        border: '1px solid #dee2e6',
                        backgroundColor: 'white',
                        color: '#495057',
                        fontWeight: '500'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePerformance(index)}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 2px 6px rgba(255,107,107,0.3)'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            {performances.length === 0 && (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#6c757d',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6',
                fontSize: '14px'
              }}>
                No performances scheduled. Click "Add Performance" to add one.
              </div>
            )}
          </div>

          {/* Print Option */}
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            borderRadius: '12px',
            border: '1px solid #2196f3'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showPrintOption}
                onChange={(e) => setShowPrintOption(e.target.checked)}
                style={{ 
                  marginRight: '12px', 
                  width: '20px', 
                  height: '20px',
                  accentColor: '#2196f3',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#1976d2' }}>
                🖨️ Print new label after saving
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              💾 Save Changes
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '16px',
                background: '#f8f9fa',
                color: '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Print-only section */}
        {shouldPrint && updatedItem && (
          <div className="print-only">
            <div className="print-label-page">
              <img
                src={updatedItem.qr_code}
                alt={`QR Code for ${updatedItem.description}`}
                style={{
                  width: '50mm',
                  height: '50mm',
                  display: 'block',
                  margin: '0 auto 3mm auto'
                }}
              />
              <div style={{
                fontSize: '5mm',
                fontWeight: 'bold',
                marginBottom: '2mm',
                textAlign: 'center'
              }}>
                {updatedItem.band_id}
              </div>
              <div style={{
                fontSize: '4.5mm',
                marginBottom: '2mm',
                textAlign: 'center'
              }}>
                {updatedItem.description}
              </div>
              <div style={{
                fontSize: '3.5mm',
                color: '#666',
                textAlign: 'center'
              }}>
                #{String(updatedItem.display_id || '0000').padStart(4, '0')}
              </div>
            </div>
          </div>
        )}

      <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
            .print-only { position: absolute; left: 0; top: 0; }
            .no-print { display: none !important; }
            
            .print-label-page {
              display: block;
              width: 74mm;
              height: 105mm;
              padding: 5mm;
              box-sizing: border-box;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            
            @page {
              size: 74mm 105mm;
              margin: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
