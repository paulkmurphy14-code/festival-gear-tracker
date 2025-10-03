import { useState, useEffect } from 'react';
import { db } from '../db';
import { generateQRCode } from '../utils/qrCode';

export default function EditGear({ item, onSave, onCancel }) {
  const [description, setDescription] = useState(item.description);
  const [bandName, setBandName] = useState(item.band_id);
  const [performances, setPerformances] = useState([]);
  const [showPrintOption, setShowPrintOption] = useState(false);
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
    const perfs = await db.performances.where('band_id').equals(item.band_id).toArray();
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
      setMessage('❌ Band name and description are required');
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
        await db.performances.where('band_id').equals(oldBandName).modify({ band_id: bandName.trim() });
      }

      await db.performances.where('band_id').equals(bandName.trim()).delete();

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
        setTimeout(async () => {
          const updatedItem = await db.gear.get(item.id);
          printLabel(updatedItem);
        }, 500);
      }
      
      setTimeout(() => {
        setMessage('');
        onSave();
      }, showPrintOption ? 2000 : 1000);
      
    } catch (error) {
      console.error('Error updating gear:', error);
      setMessage('❌ Error updating item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const printLabel = (itemData) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Label - ${itemData.description}</title>
        <style>
          @page {
            size: 74mm 105mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .label {
            width: 74mm;
            height: 105mm;
            padding: 5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-code {
            width: 50mm;
            height: 50mm;
            margin-bottom: 3mm;
          }
          .band-name {
            font-size: 5mm;
            font-weight: bold;
            margin-bottom: 2mm;
            text-align: center;
            width: 100%;
          }
          .description {
            font-size: 4.5mm;
            margin-bottom: 2mm;
            text-align: center;
            width: 100%;
          }
          .id {
            font-size: 3.5mm;
            color: #666;
            text-align: center;
            width: 100%;
          }
          @media print {
            body {
              width: 74mm;
              height: 105mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${itemData.qr_code}" alt="QR Code" class="qr-code" />
          <div class="band-name">${itemData.band_id}</div>
          <div class="description">${itemData.description}</div>
          <div class="id">ID: ${itemData.id}</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Edit Gear Item</h2>

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

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Band Name
        </label>
        <input
          type="text"
          value={bandName}
          onChange={(e) => setBandName(e.target.value)}
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

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Item Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Performance Schedule</label>
          <button
            onClick={handleAddPerformance}
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
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
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
                    border: '1px solid #ddd'
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
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
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
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
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
                    border: '1px solid #ddd'
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

        {performances.length === 0 && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#999',
            backgroundColor: '#f9f9f9',
            borderRadius: '5px',
            border: '1px dashed #ddd'
          }}>
            No performances scheduled. Click "Add Performance" to add one.
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPrintOption}
            onChange={(e) => setShowPrintOption(e.target.checked)}
            style={{ marginRight: '10px', width: '18px', height: '18px' }}
          />
          <span>Print new label after saving</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '15px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
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
          Cancel
        </button>
      </div>
    </div>
  );
}