import { useState, useEffect } from 'react';
import { db } from '../localDb';
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
      setMessage('⚠️ Please select a valid CSV file');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const parseCSV = async () => {
    if (!file) {
      setMessage('⚠️ Please select a file first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        setMessage('⚠️ CSV file is empty');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const dataLines = lines[0].toLowerCase().includes('band name') ? lines.slice(1) : lines;
      const items = [];
      const locationMap = {};

      const allLocations = await db.locations.toArray();
      allLocations.forEach(loc => {
        locationMap[loc.name.toLowerCase()] = loc.id;
      });

      for (const line of dataLines) {
        if (!line.trim()) continue;

        const parts = line.split(',').map(p => p.trim());
        const cleanedParts = parts.map(p => p.replace(/^"|"$/g, '').trim());

        if (cleanedParts.length < 2) continue;

        const bandName = cleanedParts[0];
        const description = cleanedParts[1];
        const scheduleData = cleanedParts[2] || '';
        const performances = [];

        if (scheduleData && csvFormat === 'schedule') {
          const scheduleEntries = scheduleData.split('|');

          for (const entry of scheduleEntries) {
            const parts = entry.split('~');

            if (parts.length === 3) {
              const [stageName, date, time] = parts.map(s => s.trim());

              if (stageName && date && time) {
                const locationId = locationMap[stageName.toLowerCase()];
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
        setMessage('⚠️ No valid items found in CSV');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

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

        const qrCode = await generateQRCode(gearId);
        await db.gear.update(gearId, { qr_code: qrCode });

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
      setMessage('⚠️ Error parsing CSV file: ' + error.message);
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
          Bulk Upload via CSV
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

        {importedItems.length === 0 ? (
          <div>
            {/* CSV Format Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#495057' }}>
                CSV Format
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  onClick={() => setCsvFormat('basic')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: csvFormat === 'basic' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                    color: csvFormat === 'basic' ? 'white' : '#495057',
                    border: csvFormat === 'basic' ? 'none' : '2px solid #dee2e6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: csvFormat === 'basic' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
                  }}
                >
                  Basic Format
                </button>
                <button
                  onClick={() => setCsvFormat('schedule')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: csvFormat === 'schedule' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                    color: csvFormat === 'schedule' ? 'white' : '#495057',
                    border: csvFormat === 'schedule' ? 'none' : '2px solid #dee2e6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: csvFormat === 'schedule' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
                  }}
                >
                  With Schedule
                </button>
              </div>
              <div style={{
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#6c757d',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}>
                {csvFormat === 'basic' ? (
                  <div>
                    <strong>Format:</strong> Band Name, Item Description<br/>
                    <span style={{ color: '#495057' }}>Example: The Rockers, Electric Guitar</span>
                  </div>
                ) : (
                  <div>
                    <strong>Format:</strong> Band, Item, Stage~DD-MM-YYYY~HH:MM<br/>
                    <span style={{ color: '#495057' }}>Example: The Rockers, Guitar, Main Stage~05-10-2025~20:00</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#495057'
              }}>
                Optional: Set Initial Location for All Items
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  backgroundColor: 'white',
                  color: '#495057',
                  fontWeight: '500'
                }}
              >
                <option value="">No initial location (register only)</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#495057'
              }}>
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '2px dashed #dee2e6',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer'
                }}
              />
              {file && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '8px', fontSize: '14px', color: '#1976d2' }}>
                  ✓ Selected: {file.name}
                </div>
              )}
            </div>

            {/* Import Button */}
            <button
              onClick={parseCSV}
              disabled={!file}
              style={{
                width: '100%',
                padding: '16px',
                background: file ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e9ecef',
                color: file ? 'white' : '#adb5bd',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: file ? 'pointer' : 'not-allowed',
                boxShadow: file ? '0 4px 12px rgba(102,126,234,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              📤 Import CSV
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
              ✓ {importedItems.length} items imported successfully!
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
                onClick={closePrintView}
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
                Done
              </button>
            </div>

            {/* Preview */}
            <div className="no-print">
              <h3 style={{ marginBottom: '12px', fontSize: '18px', color: '#1a1a1a', fontWeight: '700' }}>
                Preview ({importedItems.length} labels)
              </h3>
              <div style={{
                border: '2px dashed #dee2e6',
                padding: '20px',
                borderRadius: '12px',
                background: '#f8f9fa'
              }}>
                {importedItems.slice(0, 3).map(item => (
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
                {importedItems.length > 3 && (
                  <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', fontSize: '14px' }}>
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
                body * { visibility: hidden; }
                .print-only, .print-only * { visibility: visible; }
                .print-only { position: absolute; left: 0; top: 0; }
                .no-print { display: none !important; }

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
    </div>
  );
}