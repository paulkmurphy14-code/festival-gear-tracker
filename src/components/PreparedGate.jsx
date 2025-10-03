import { useState, useEffect } from 'react';
import { db } from '../db';
import { generateQRCode } from '../utils/qrCode';

export default function PreparedGate() {
  const [file, setFile] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [importedItems, setImportedItems] = useState([]);
  const [message, setMessage] = useState('');
  const [csvFormat, setCsvFormat] = useState('basic');
  const [printLayout, setPrintLayout] = useState('sheet');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locs = await db.locations.toArray();
      setLocations(locs);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setMessage('');
    } else {
      setMessage('❌ Please select a valid CSV file');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const parseCSV = async () => {
    if (!file) {
      setMessage('❌ Please select a file first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setMessage('❌ CSV file is empty');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Skip header row if present
      const dataLines = lines[0].toLowerCase().includes('band name') ? lines.slice(1) : lines;
      const items = [];
      const locationMap = {};
      
      // Build location map for quick lookup
      const allLocations = await db.locations.toArray();
      allLocations.forEach(loc => {
        locationMap[loc.name.toLowerCase()] = loc.id;
      });

      for (const line of dataLines) {
        if (!line.trim()) continue;
        
        // Use regex to handle commas within quoted fields
        const parts = line.split(',').map(p => p.trim());
        const cleanedParts = parts.map(p => p.replace(/^"|"$/g, '').trim());
        
        if (cleanedParts.length < 2) continue;

        const bandName = cleanedParts[0];
        const description = cleanedParts[1];
        const scheduleData = cleanedParts[2] || '';
        const performances = [];
        
        // Parse schedule if format includes it
        if (scheduleData && csvFormat === 'schedule') {
          const scheduleEntries = scheduleData.split('|');
          
          for (const entry of scheduleEntries) {
            // Use a more robust parsing method
            // Format: StageName~DD-MM-YYYY~HH:MM (using ~ as internal delimiter)
            // But for backwards compatibility, try to parse with colons
            const parts = entry.split('~');
            
            if (parts.length === 3) {
              const [stageName, date, time] = parts.map(s => s.trim());
              
              if (stageName && date && time) {
                const locationId = locationMap[stageName.toLowerCase()];
                // Convert DD-MM-YYYY to YYYY-MM-DD for database
                const dateParts = date.split('-');
                const convertedDate = dateParts.length === 3 ? 
                  `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : date;

                if (locationId) {
                  performances.push({
                    location: stageName,
                    locationId: locationId,
                    date: convertedDate,
                    time: time
                  });
                }
              }
            } else {
              // Fallback to colon-based parsing (less reliable)
              const colonParts = entry.split(':').map(s => s.trim());
              
              if (colonParts.length >= 4) {
                const stageName = colonParts[0];
                const date = colonParts[1];
                const time = `${colonParts[2]}:${colonParts[3]}`;
                
                if (stageName && date && time) {
                  const locationId = locationMap[stageName.toLowerCase()];
                  
                  if (locationId) {
                    performances.push({
                      location: stageName,
                      locationId: locationId,
                      date: date,
                      time: time
                    });
                  }
                }
              }
            }
          }
        }

        items.push({
          band: bandName,
          description: description,
          performances: performances
        });
      }

      if (items.length === 0) {
        setMessage('❌ No valid items found in CSV');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Import items into database
      const itemsToImport = [];
      
      for (const item of items) {
        const gearId = await db.gear.add({
          band_id: item.band,
          description: item.description,
          qr_code: '',
          current_location_id: selectedLocation ? parseInt(selectedLocation) : null,
          status: 'active',
          created_at: new Date(),
          in_transit: false,
          checked_out: false,
          lastUpdated: new Date()
        });

        const qrCode = await generateQRCode(`GEAR:${gearId}`);
        
        await db.gear.update(gearId, { qr_code: qrCode });

        // Add performances
        for (const perf of item.performances) {
          if (perf.location && perf.date && perf.time) {
            await db.performances.add({
              band_id: item.band,
              location_id: perf.locationId,
              date: perf.date,
              time: perf.time
            });
          }
        }

        itemsToImport.push({
          id: gearId,
          band: item.band,
          description: item.description,
          qrCode: qrCode,
          performances: item.performances
        });
      }

      setImportedItems(itemsToImport);
      setMessage(`✓ Successfully imported ${itemsToImport.length} items!`);
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Error parsing CSV:', error);
      setMessage('❌ Error parsing CSV file: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const closePrintView = () => {
    setImportedItems([]);
    setFile(null);
    setSelectedLocation('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Bulk Upload via CSV</h2>

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

      {importedItems.length === 0 ? (
        <div>
          <div style={{
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #2196f3'
          }}>
            <h3 style={{ marginTop: 0 }}>CSV Format Options</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="basic"
                  checked={csvFormat === 'basic'}
                  onChange={(e) => setCsvFormat(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <strong>Basic Format (Band Name, Item Description)</strong>
              </label>
              <div style={{ marginLeft: '30px', fontSize: '14px', color: '#555' }}>
                Example:<br/>
                <code>The Rockers, Electric Guitar<br/>
                The Rockers, Bass Amplifier<br/>
                Jazz Cats, Saxophone</code>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="schedule"
                  checked={csvFormat === 'schedule'}
                  onChange={(e) => setCsvFormat(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <strong>With Schedule (Band Name, Item Description, Schedule)</strong>
              </label>
              <div style={{ marginLeft: '30px', fontSize: '14px', color: '#555' }}>
                <strong>Recommended format:</strong> StageName~DD-MM-YYYY~HH:MM (use | to separate multiple performances)<br/>
                Example:<br/>
                <code>The Rockers, Guitar, The Salty Dog~2025-10-05~20:00|Providencia~2025-10-06~21:30<br/>
                Jazz Cats, Saxophone, Providencia~2025-10-05~19:00</code>
                <br/><br/>
                <em>Legacy format with colons also supported but less reliable.</em>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              Optional: Set Initial Location for All Items
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                marginBottom: '10px'
              }}
            >
              <option value="">No initial location (register only)</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.emoji ? `${loc.emoji} ` : ''}{loc.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <button
            onClick={parseCSV}
            disabled={!file}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: file ? '#0066cc' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: file ? 'pointer' : 'not-allowed'
            }}
          >
            Import CSV
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
            <strong>✓ {importedItems.length} items imported successfully!</strong>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Print Layout</h3>
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
              🖨️ Print Labels
            </button>
            <button
              onClick={closePrintView}
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
              Done
            </button>
          </div>

          <div className="no-print">
            <h3>Preview ({importedItems.length} labels)</h3>
            <div style={{
              border: '2px dashed #ddd',
              padding: '20px',
              borderRadius: '5px',
              backgroundColor: '#fafafa'
            }}>
              {importedItems.slice(0, 3).map(item => (
                <div key={item.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: 'white',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}>
                  <strong>{item.band}</strong> - {item.description}
                </div>
              ))}
              {importedItems.length > 3 && (
                <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                  ...and {importedItems.length - 3} more
                </div>
              )}
            </div>
          </div>

          {/* Print View */}
          <div className="print-only">
            {importedItems.map(item => (
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