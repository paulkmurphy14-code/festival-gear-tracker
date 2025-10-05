import { useState, useEffect } from 'react';
import { db } from '../db';
import { generateQRCode } from '../utils/qrCode';

export default function RegisterGear() {
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
      setMessage('⚠️ Band name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const validItems = items.filter(item => item.description.trim());

    if (validItems.length === 0) {
      setMessage('⚠️ At least one item description is required');
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
            location_id: parseInt(perf.location),
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
      setMessage('⚠️ Error registering items');
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
          Register Gear (Chaos Gate)
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

        {registeredItems.length === 0 ? (
          <div>
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
                placeholder="Enter band name"
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

            {/* Items Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{ fontSize: '16px', fontWeight: '600', color: '#495057' }}>
                  Items
                </label>
                <button
                  onClick={handleAddItem}
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
                  + Add Another Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={`Item ${index + 1} description`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '12px',
                      border: '1px solid #dee2e6',
                      backgroundColor: 'white',
                      color: '#495057',
                      fontWeight: '500'
                    }}
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(index)}
                      style={{
                        padding: '12px 20px',
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
                      Remove
                    </button>
                  )}
                </div>
              ))}
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
                  Performance Schedule (Optional)
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
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Register Items
            </button>
          </div>
        ) : (
          <div>
            {/* Success Message */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
              borderRadius: '16px',
              marginBottom: '24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(81,207,102,0.3)'
            }}>
              ✓ {registeredItems.length} item(s) registered successfully!
            </div>

            {/* Print Layout Selection */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', color: '#1a1a1a', fontWeight: '700' }}>
                Print Layout
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setPrintLayout('sheet')}
                  style={{
                    padding: '12px 24px',
                    background: printLayout === 'sheet' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                    color: printLayout === 'sheet' ? 'white' : '#495057',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: printLayout === 'sheet' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
                  }}
                >
                  Multiple per Sheet
                </button>
                <button
                  onClick={() => setPrintLayout('pages')}
                  style={{
                    padding: '12px 24px',
                    background: printLayout === 'pages' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                    color: printLayout === 'pages' ? 'white' : '#495057',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: printLayout === 'pages' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
                  }}
                >
                  One per Page
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(81,207,102,0.3)'
                }}
              >
                🖨️ Print Labels
              </button>
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Register More Items
              </button>
            </div>

            {/* Preview */}
            <div className="no-print">
              <h3 style={{ marginBottom: '12px', fontSize: '18px', color: '#1a1a1a', fontWeight: '700' }}>
                Preview ({registeredItems.length} labels)
              </h3>
              <div style={{
                border: '2px dashed #dee2e6',
                padding: '20px',
                borderRadius: '12px',
                background: '#f8f9fa'
              }}>
                {registeredItems.slice(0, 3).map(item => (
                  <div key={item.id} style={{
                    padding: '12px',
                    marginBottom: '10px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #dee2e6',
                    fontSize: '15px',
                    color: '#495057'
                  }}>
                    <strong>{item.band}</strong> - {item.description}
                  </div>
                ))}
                {registeredItems.length > 3 && (
                  <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', fontSize: '14px' }}>
                    ...and {registeredItems.length - 3} more
                  </div>
                )}
              </div>
            </div>

            {/* Print View */}
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
                    ID: {item.id}
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              @media print {
                body * { visibility: hidden; }
                .print-only, .print-only * { visibility: visible; }
                .print-only { position: absolute; left: 0; top: 0; }
                .no-print { display: none !important; }

                @page {
                  size: ${printLayout === 'pages' ? '74mm 105mm' : 'A4'};
                  margin: ${printLayout === 'pages' ? '0' : '8mm'};
                }


                .print-label-page:last-child {
                  page-break-after: avoid;
                }

                ${printLayout === 'pages' ? `
                  .print-label-page {
                    display: block;
                    width: 74mm;
                    height: 105mm;
                    padding: 5mm;
                    box-sizing: border-box;
                    page-break-after: avoid;
                    page-break-inside: avoid;
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
    </div>
  );
}