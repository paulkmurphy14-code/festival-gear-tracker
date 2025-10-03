import { useState, useEffect, useCallback } from 'react';
import RegisterGear from './components/RegisterGear';
import PreparedGate from './components/PreparedGate';
import GearList from './components/GearList';
import Scanner from './components/Scanner';
import Schedule from './components/Schedule';
import LocationManager from './components/LocationManager';
import { db } from './db';

const GlobalStyles = () => (
  <style>{`
    body {
      font-size: 16px;
      line-height: 1.5;
      color: #333;
    }
    
    input, select, textarea {
      font-size: 16px !important;
      min-height: 44px;
      color: #333 !important;
    }
    
    label {
      color: #333 !important;
      font-size: 14px;
      font-weight: bold;
    }
    
    button {
      min-height: 48px;
      touch-action: manipulation;
    }
  `}</style>
);

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [scannedGear, setScannedGear] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationColors, setLocationColors] = useState({});
  const [message, setMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const locs = await db.locations.toArray();
      setLocations(locs);
      
      const colorMap = {};
      locs.forEach(loc => {
        colorMap[loc.id] = loc.color;
      });
      setLocationColors(colorMap);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, []);

  const handleScan = useCallback(async (qrData) => {
    console.log('handleScan called with:', qrData);
    
    if (qrData.startsWith('GEAR:')) {
      const gearId = parseInt(qrData.replace('GEAR:', ''));
      
      try {
        const gear = await db.gear.get(gearId);
        
        if (gear) {
          setScannedGear(gear);
          setActiveTab('scan');
        } else {
          alert('Gear item not found in database');
        }
      } catch (error) {
        console.error('Error fetching gear:', error);
        alert('Error retrieving gear item');
      }
    }
  }, []);

  const handleLocationSelect = useCallback(async (locationId) => {
    if (!scannedGear) return;

    try {
      if (scannedGear.checked_out) {
        await db.gear.update(scannedGear.id, {
          current_location_id: locationId,
          checked_out: false,
          in_transit: false,
          lastUpdated: new Date()
        });
        
        await db.scans.add({
          gear_id: scannedGear.id,
          location_id: locationId,
          timestamp: new Date(),
          synced: false
        });
        
        setMessage('✓ Item checked back in successfully!');
      } else if (scannedGear.in_transit) {
        await db.gear.update(scannedGear.id, {
          current_location_id: locationId,
          in_transit: false,
          lastUpdated: new Date()
        });
        
        await db.scans.add({
          gear_id: scannedGear.id,
          location_id: locationId,
          timestamp: new Date(),
          synced: false
        });
        
        setMessage('✓ Item checked in successfully!');
      } else {
        await db.gear.update(scannedGear.id, {
          current_location_id: locationId,
          lastUpdated: new Date()
        });
        
        await db.scans.add({
          gear_id: scannedGear.id,
          location_id: locationId,
          timestamp: new Date(),
          synced: false
        });
        
        setMessage('✓ Location updated successfully!');
      }
      
      setTimeout(() => setMessage(''), 3000);
      setScannedGear(null);
      setRefreshTrigger(prev => prev + 1);
      setActiveTab('home');
    } catch (error) {
      console.error('Error updating location:', error);
      setMessage('❌ Error updating location');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [scannedGear]);

  const handleCheckOut = useCallback(async (type) => {
    if (!scannedGear) return;

    try {
      if (type === 'transit') {
        await db.gear.update(scannedGear.id, {
          in_transit: true,
          lastUpdated: new Date()
        });
        setMessage('✓ Item checked out for transit!');
      } else if (type === 'band') {
        await db.gear.update(scannedGear.id, {
          checked_out: true,
          lastUpdated: new Date()
        });
        setMessage('✓ Item checked out to band!');
      }
      
      setTimeout(() => setMessage(''), 3000);
      setScannedGear(null);
      setRefreshTrigger(prev => prev + 1);
      setActiveTab('home');
    } catch (error) {
      console.error('Error checking out:', error);
      setMessage('❌ Error checking out item');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [scannedGear]);

  const handleLocationsUpdate = useCallback(() => {
    loadLocations();
    setRefreshTrigger(prev => prev + 1);
  }, [loadLocations]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <GlobalStyles />
      {/* Header */}
      <div style={{ backgroundColor: '#0066cc', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '22px', flex: 1 }}>Festival Gear Tracker</h1>
        {activeTab !== 'home' && (
          <button
            onClick={() => setActiveTab('home')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid white',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Home
          </button>
        )}
      </div>

      {message && (
        <div style={{
          padding: '15px',
          margin: '15px',
          backgroundColor: message.includes('❌') ? '#ffebee' : '#e8f5e9',
          color: message.includes('❌') ? '#c62828' : '#2e7d32',
          borderRadius: '5px',
          textAlign: 'center',
          border: `1px solid ${message.includes('❌') ? '#ef5350' : '#66bb6a'}`,
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* Main Menu */}
      {activeTab === 'home' && (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '20px', color: '#333' }}>
            Select an Action
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => setActiveTab('scanner')}
              style={{
                padding: '25px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📷 SCAN QR CODE</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                Check in/out items
              </div>
            </button>

            <button
              onClick={() => setActiveTab('gear')}
              style={{
                padding: '25px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📦 GEAR LIST</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                View and manage inventory
              </div>
            </button>

            <button
              onClick={() => setActiveTab('chaos')}
              style={{
                padding: '25px',
                backgroundColor: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>➕ REGISTER GEAR</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                Add new items
              </div>
            </button>

            <button
              onClick={() => setActiveTab('prepared')}
              style={{
                padding: '25px',
                backgroundColor: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📄 BULK UPLOAD</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                Import from CSV
              </div>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                padding: '25px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📅 SCHEDULE</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                View performances
              </div>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              style={{
                padding: '25px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📍 LOCATIONS</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                Manage stages and areas
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Content Pages */}
      <div style={{ padding: activeTab === 'home' ? '0' : '15px' }}>
        {activeTab === 'chaos' && <RegisterGear locationColors={locationColors} />}
        {activeTab === 'prepared' && <PreparedGate locationColors={locationColors} />}
        {activeTab === 'schedule' && <Schedule key={refreshTrigger} locationColors={locationColors} />}
        {activeTab === 'gear' && <GearList key={refreshTrigger} locationColors={locationColors} />}
        {activeTab === 'locations' && <LocationManager onUpdate={handleLocationsUpdate} />}
        
        {activeTab === 'scanner' && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, textAlign: 'center', fontSize: '20px' }}>Scan QR Code</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Point your camera at a gear QR code
            </p>
            <Scanner onScan={handleScan} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                padding: '15px',
                minHeight: '48px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {activeTab === 'scan' && scannedGear && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, fontSize: '20px' }}>Scanned Item</h2>
            
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Band:</strong> {scannedGear.band_id}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Description:</strong> {scannedGear.description}
              </div>
              <div>
                <strong>Current Status:</strong>{' '}
                {scannedGear.checked_out ? (
                  <span style={{ color: '#95a5a6', fontWeight: 'bold' }}>Checked Out to Band</span>
                ) : scannedGear.in_transit ? (
                  <span style={{ color: '#f39c12', fontWeight: 'bold' }}>In Transit</span>
                ) : scannedGear.current_location_id ? (
                  <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                    At {locations.find(l => l.id === scannedGear.current_location_id)?.name || 'Unknown'}
                  </span>
                ) : (
                  <span style={{ color: '#95a5a6' }}>Not checked in yet</span>
                )}
              </div>
            </div>

            {scannedGear.checked_out ? (
              <div>
                <h3 style={{ fontSize: '18px' }}>Check Back In</h3>
                <p style={{ fontSize: '14px' }}>Select location to check this item back in:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '15px',
                        minHeight: '48px',
                        backgroundColor: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      {loc.emoji && `${loc.emoji} `}{loc.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : scannedGear.in_transit ? (
              <div>
                <h3 style={{ fontSize: '18px' }}>Check IN to Location</h3>
                <p style={{ fontSize: '14px' }}>Item is currently in transit. Select destination:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '15px',
                        minHeight: '48px',
                        backgroundColor: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      {loc.emoji && `${loc.emoji} `}{loc.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : scannedGear.current_location_id ? (
              <div>
                <h3 style={{ fontSize: '18px' }}>Check Out Options</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => handleCheckOut('transit')}
                    style={{
                      padding: '15px',
                      minHeight: '48px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Check OUT (Moving within festival)
                  </button>
                  <button
                    onClick={() => handleCheckOut('band')}
                    style={{
                      padding: '15px',
                      minHeight: '48px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Check Out to Band (Off-site)
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '18px' }}>Select Initial Location</h3>
                <p style={{ fontSize: '14px' }}>This item hasn't been checked in yet. Select a location:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '15px',
                        minHeight: '48px',
                        backgroundColor: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      {loc.emoji && `${loc.emoji} `}{loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setScannedGear(null);
                setActiveTab('home');
              }}
              style={{
                marginTop: '20px',
                padding: '15px',
                minHeight: '48px',
                backgroundColor: '#ddd',
                color: '#333',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;