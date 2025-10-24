import { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { generateQRCode } from '../utils/qrCode';

export default function RegisterGear() {
  const db = useDatabase();
  const [items, setItems] = useState([{ description: '' }]);
  const [bandName, setBandName] = useState('');
  const [performances, setPerformances] = useState([]);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [message, setMessage] = useState('');
  const [printLayout, setPrintLayout] = useState('sheet');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const locs = await db.locations.toArray();
    setLocations(locs);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, value) => {
    const updated = [...items];
    updated[index].description = value;
    setItems(updated);
  };

  const handleAddPerformance = () => {
    setPerformances([...performances, { location: '', date: '', time: '' }]);
  };

  const handleRemovePerformance = (index) => {
    setPerformances(performances.filter((_, i) => i !== index));
  };

  const handlePerformanceChange = (index, field, value) => {
    const updated = [...performances];
    updated[index][field] = value;
    setPerformances(updated);
  };

  const handleRegister = async () => {
    if (!bandName.trim()) {
      setMessage('❌ Band name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      setMessage('❌ At least one item description is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const registered = [];
      for (const item of validItems) {
        const gearId = await db.gear.add({
          band_id: bandName.trim(),
          description: item.description.trim(),
          qr_code: '',
          current_location_id: null,
          status: 'active',
          created_at: new Date(),
          in_transit: false,
          checked_out: false,
          lastUpdated: new Date()
        });

        const qrCode = await generateQRCode(gearId);
        await db.gear.update(gearId, { qr_code: qrCode });

        registered.push({
          id: gearId,
          band: bandName.trim(),
          description: item.description.trim(),
          qrCode: qrCode
        });
      }

      for (const perf of performances) {
        if (perf.location && perf.date && perf.time) {
          await db.performances.add({
            band_id: bandName.trim(),
            location_id: perf.location,
            date: perf.date,
            time: perf.time
          });
        }
      }

      setRegisteredItems(registered);
      setMessage(`✓ Registered ${registered.length} item(s) successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error registering gear:', error);
      setMessage('❌ Error registering items');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setItems([{ description: '' }]);
    setBandName('');
    setPerformances([]);
    setRegisteredItems([]);
    setPrintLayout('sheet');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Register Gear (Chaos Gate)</h2>

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

      {registeredItems.length === 0 ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Band Name
            </label>
            <input
              type="text"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Enter band name"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box',
                color: '#333',
                backgroundColor: '#fff'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <label style={{ fontWeight: 'bold', color: '#333' }}>Items</label>
              <button
                onClick={handleAddItem}
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
                + Add Another Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={`Item ${index + 1} description`}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    color: '#333',
                    backgroundColor: '#fff'
                  }}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => handleRemoveItem(index)}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <label style={{ fontWeight: 'bold', color: '#333' }}>Performance Schedule (Optional)</label>
              <button
                onClick={handleAddPerformance}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#9c27b0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                + Add Performance
              </button>
            </div>

            {performances.map((perf, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
                      Stage/Location
                    </label>
                    <select
                      value={perf.location}
                      onChange={(e) => handlePerformanceChange(index, 'location', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                        color: '#333',
                        backgroundColor: '#fff'
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
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={perf.date}
                      onChange={(e) => handlePerformanceChange(index, 'date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                        color: '#333',
                        backgroundColor: '#fff'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={perf.time}
                      onChange={(e) => handlePerformanceChange(index, 'time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                        color: '#333',
                        backgroundColor: '#fff'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePerformance(index)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleRegister}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Register Items
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #4caf50'
          }}>
            <strong>✓ {registeredItems.length} item(s) registered successfully!</strong>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#1a1a1a' }}>Print Layout</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={() => setPrintLayout('sheet')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: printLayout === 'sheet' ? '#0066cc' : '#f0f0f0',
                  color: printLayout === 'sheet' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: printLayout === 'sheet' ? 'bold' : 'normal'
                }}
              >
                Multiple per Sheet
              </button>
              <button
                onClick={() => setPrintLayout('pages')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: printLayout === 'pages' ? '#0066cc' : '#f0f0f0',
                  color: printLayout === 'pages' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: printLayout === 'pages' ? 'bold' : 'normal'
                }}
              >
                One per Page
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Print Labels
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Register More Items
            </button>
          </div>

          <div className="no-print">
            <h3 style={{ color: '#1a1a1a' }}>Preview ({registeredItems.length} labels)</h3>
            <div style={{
              border: '2px dashed #ddd',
              padding: '20px',
              borderRadius: '5px',
              backgroundColor: '#fafafa'
            }}>
              {registeredItems.slice(0, 3).map(item => (
                <div key={item.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: 'white',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  color: '#333'
                }}>
                  <strong>{item.band}</strong> - {item.description}
                </div>
              ))}
              {registeredItems.length > 3 && (
                <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                  ...and {registeredItems.length - 3} more
                </div>
              )}
            </div>
          </div>

          <div className="print-only">
            {registeredItems.map(item => (
              <div
                key={item.id}
                className={printLayout === 'sheet' ? 'print-label-small' : 'print-label-page'}
              >
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
                  fontSize: '5mm',
                  fontWeight: 'bold',
                  marginBottom: '2mm',
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
                  fontSize: '3.5mm',
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

              .no-print {
                display: none !important;
              }
              
              .print-only {
                display: block !important;
              }

              @page {
                size: ${printLayout === 'pages' ? '74mm 105mm' : 'A4'};
                margin: ${printLayout === 'pages' ? '0' : '8mm'};
              }

              ${printLayout === 'pages' ? `
                .print-label-page {
                  display: block;
                  width: 74mm;
                  height: 105mm;
                  padding: 5mm;
                  box-sizing: border-box;
                  page-break-after: always;
                  page-break-inside: avoid;
                }
                .print-label-page:last-child {
                  page-break-after: avoid;
                }
                .print-label-small {
                  display: none;
                }
              ` : `
                .print-label-small {
                  display: inline-block;
                  width: 90mm;
                  padding: 5mm;
                  margin: 2mm;
                  box-sizing: border-box;
                  vertical-align: top;
                  page-break-inside: avoid;
                }
                .print-label-page {
                  display: none;
                }
              `}
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