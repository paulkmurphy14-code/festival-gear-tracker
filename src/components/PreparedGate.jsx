import { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useRole } from '../hooks/useRole';
import { generateQRCode } from '../utils/qrCode';

export default function PreparedGate({ onDataChange }) {
  const db = useDatabase();
  const { canBulkUploadCSV } = useRole();
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

      if (!selectedLocation) {
        setMessage('⚠️ Initial location is required for all items');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const itemsToImport = [];

      for (const item of items) {
        const gearId = await db.gear.add({
          band_id: item.band,
          description: item.description,
          qr_code: '',
          current_location_id: selectedLocation || null,
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
      onDataChange?.();
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

  if (!canBulkUploadCSV) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#888'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffa500' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          You don't have permission to upload CSV files.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: '#2d2d2d',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        border: '2px solid #664400'
      }}>
        <h2 style={{
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '26px',
          color: '#ffa500',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Bulk Upload via CSV
        </h2>

        {message && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            background: message.includes('⚠️') ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
            color: message.includes('⚠️') ? '#ff6b6b' : '#4caf50',
            border: `2px solid ${message.includes('⚠️') ? '#ff6b6b' : '#4caf50'}`,
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        {importedItems.length === 0 ? (
          <div>
            {/* CSV Format Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#ffa500' }}>
                CSV Format
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  onClick={() => setCsvFormat('basic')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: csvFormat === 'basic' ? '#ffa500' : '#1a1a1a',
                    color: csvFormat === 'basic' ? '#1a1a1a' : '#e0e0e0',
                    border: csvFormat === 'basic' ? 'none' : '2px solid #664400',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: csvFormat === 'basic' ? '0 3px 0 #664400' : 'none'
                  }}
                >
                  Basic Format
                </button>
                <button
                  onClick={() => setCsvFormat('schedule')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: csvFormat === 'schedule' ? '#ffa500' : '#1a1a1a',
                    color: csvFormat === 'schedule' ? '#1a1a1a' : '#e0e0e0',
                    border: csvFormat === 'schedule' ? 'none' : '2px solid #664400',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: csvFormat === 'schedule' ? '0 3px 0 #664400' : 'none'
                  }}
                >
                  With Schedule
                </button>
              </div>
              <div style={{
                padding: '12px 16px',
                background: '#1a1a1a',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#888',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                border: '1px solid #664400'
              }}>
                {csvFormat === 'basic' ? (
                  <div>
                    <strong style={{ color: '#ffa500' }}>Format:</strong> Band Name, Item Description<br/>
                    <span style={{ color: '#e0e0e0' }}>Example: The Rockers, Electric Guitar</span>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: '#ffa500' }}>Format:</strong> Band, Item, Stage~DD-MM-YYYY~HH:MM<br/>
                    <span style={{ color: '#e0e0e0' }}>Example: The Rockers, Guitar, Main Stage~05-10-2025~20:00</span>
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
                color: '#ffa500'
              }}>
                Initial Location for All Items *
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '2px solid #664400',
                  backgroundColor: '#1a1a1a',
                  color: '#e0e0e0',
                  fontWeight: '500'
                }}
              >
                <option value="">Select location... *</option>
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
                color: '#ffa500'
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
                  border: '2px dashed #664400',
                  backgroundColor: '#1a1a1a',
                  color: '#e0e0e0',
                  cursor: 'pointer'
                }}
              />
              {file && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(76, 175, 80, 0.2)', borderRadius: '8px', fontSize: '14px', color: '#4caf50', border: '1px solid #4caf50' }}>
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
                background: file ? '#ffa500' : '#3a3a3a',
                color: file ? '#1a1a1a' : '#666',
                border: file ? 'none' : '2px solid #664400',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: file ? 'pointer' : 'not-allowed',
                boxShadow: file ? '0 3px 0 #664400' : 'none',
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
              background: 'rgba(76, 175, 80, 0.2)',
              borderRadius: '16px',
              marginBottom: '24px',
              color: '#4caf50',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #4caf50'
            }}>
              ✓ {importedItems.length} items imported successfully!
            </div>

            {/* Print Layout Selection */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', color: '#ffa500', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Print Layout
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setPrintLayout('sheet')}
                  style={{
                    padding: '12px 24px',
                    background: printLayout === 'sheet' ? '#ffa500' : '#1a1a1a',
                    color: printLayout === 'sheet' ? '#1a1a1a' : '#e0e0e0',
                    border: printLayout === 'sheet' ? 'none' : '2px solid #664400',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: printLayout === 'sheet' ? '0 3px 0 #664400' : 'none'
                  }}
                >
                  Multiple per Sheet
                </button>
                <button
                  onClick={() => setPrintLayout('pages')}
                  style={{
                    padding: '12px 24px',
                    background: printLayout === 'pages' ? '#ffa500' : '#1a1a1a',
                    color: printLayout === 'pages' ? '#1a1a1a' : '#e0e0e0',
                    border: printLayout === 'pages' ? 'none' : '2px solid #664400',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: printLayout === 'pages' ? '0 3px 0 #664400' : 'none'
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
                  background: '#4caf50',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #2e7d32'
                }}
              >
                🖨️ Print Labels
              </button>
              <button
                onClick={closePrintView}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#2d2d2d',
                  color: '#ffa500',
                  border: '2px solid #ffa500',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>

            {/* Preview */}
            <div className="no-print">
              <h3 style={{ marginBottom: '12px', fontSize: '18px', color: '#ffa500', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Preview ({importedItems.length} labels)
              </h3>
              <div style={{
                border: '2px dashed #664400',
                padding: '20px',
                borderRadius: '12px',
                background: '#1a1a1a'
              }}>
                {importedItems.slice(0, 3).map(item => (
                  <div key={item.id} style={{
                    padding: '12px',
                    marginBottom: '10px',
                    background: '#2d2d2d',
                    borderRadius: '10px',
                    border: '2px solid #664400',
                    fontSize: '15px',
                    color: '#e0e0e0'
                  }}>
                    <strong style={{ color: '#ffa500' }}>{item.band}</strong> - {item.description}
                  </div>
                ))}
                {importedItems.length > 3 && (
                  <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '14px' }}>
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