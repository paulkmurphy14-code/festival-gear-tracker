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
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      overflow-x: hidden;
    }
    
    * {
      box-sizing: border-box;
    }
    
    input, select, textarea {
      font-size: 16px !important;
      min-height: 44px;
      color: #333 !important;
    }
    
    label {
      color: #333 !important;
      font-size: 14px;
      font-weight: 600;
    }
    
    button {
      min-height: 48px;
      touch-action: manipulation;
      transition: all 0.2s ease;
    }
    
    button:active {
      transform: scale(0.98);
    }
  `}</style>
);

const PageContainer = ({ children, isHome = false }) => (
  <div style={{
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: isHome ? '15px' : '20px',
    boxSizing: 'border-box'
  }}>
    {children}
  </div>
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
  
  if (qrData && qrData.startsWith('GEAR:')) {
    const gearIdString = qrData.replace('GEAR:', '').trim();
    const gearId = parseInt(gearIdString, 10);
    
    console.log('Parsed gear ID:', gearId);
    
    if (isNaN(gearId)) {
      alert('Invalid QR code format');
      return;
    }
    
    try {
      const gear = await db.gear.get(gearId);
      
      if (gear) {
        setScannedGear(gear);
        setActiveTab('scan');
      } else {
        alert(`Gear item ID ${gearId} not found in database`);
      }
    } catch (error) {
      console.error('Error fetching gear:', error);
      alert('Error retrieving gear item: ' + error.message);
    }
  } else {
    alert('QR code does not match expected format (GEAR:ID)');
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <GlobalStyles />
      
      {/* Header */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🎪
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#1a1a1a', fontWeight: '700' }}>
              Festival Gear Tracker
            </h1>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '500', marginTop: '2px' }}>
              Organise Chaos Like a Pro
            </div>
          </div>
        </div>
        {activeTab !== 'home' && (
          <button
            onClick={() => setActiveTab('home')}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
            }}
          >
            ← Menu
          </button>
        )}
      </div>

      {message && (
        <div style={{
          padding: '16px',
          margin: '15px',
          background: message.includes('❌') ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
          color: 'white',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          maxWidth: '600px',
          margin: '15px auto',
          boxSizing: 'border-box'
        }}>
          {message}
        </div>
      )}

      {/* Main Menu */}
      {activeTab === 'home' && (
        <PageContainer isHome={true}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 4px 0', fontWeight: '700' }}>
              Welcome Back
            </h2>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>
              Select an action to get started
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('scanner')}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(81, 207, 102, 0.3)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>📷</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>SCAN QR CODE</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
                    Check in or check out gear items
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('chaos')}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #cc5de8 0%, #9c36b5 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(204, 93, 232, 0.3)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>➕</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>REGISTER GEAR</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
                    Add new items to inventory
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('gear')}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(77, 171, 247, 0.3)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>GEAR LIST</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
                    View and manage all inventory
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #ffd43b 0%, #fab005 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(255, 212, 59, 0.3)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>📅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>SCHEDULE</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
                    View band performances
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('prepared')}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #ffa94d 0%, #fd7e14 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(255, 169, 77, 0.3)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>BULK UPLOAD</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
                    Import multiple items via CSV
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #a3a3a3 0%, #737373 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(163, 163, 163, 0.3)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>📍</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>LOCATIONS</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
                    Manage stages and areas
                  </div>
                </div>
              </div>
            </button>
          </div>
        </PageContainer>
      )}

      {/* Content Pages */}
      {activeTab === 'chaos' && (
        <PageContainer>
          <RegisterGear locationColors={locationColors} />
        </PageContainer>
      )}
      
      {activeTab === 'prepared' && (
        <PageContainer>
          <PreparedGate locationColors={locationColors} />
        </PageContainer>
      )}
      
      {activeTab === 'schedule' && (
        <PageContainer>
          <Schedule key={refreshTrigger} locationColors={locationColors} />
        </PageContainer>
      )}
      
      {activeTab === 'gear' && (
        <PageContainer>
          <GearList key={refreshTrigger} locationColors={locationColors} />
        </PageContainer>
      )}
      
      {activeTab === 'locations' && (
        <PageContainer>
          <LocationManager onUpdate={handleLocationsUpdate} />
        </PageContainer>
      )}
      
      {activeTab === 'scanner' && (
        <PageContainer>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginTop: 0, textAlign: 'center', fontSize: '22px', color: '#1a1a1a', fontWeight: '700' }}>
              Scan QR Code
            </h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px', fontSize: '14px' }}>
              Point your camera at a gear QR code
            </p>
            <Scanner onScan={handleScan} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                padding: '16px',
                minHeight: '52px',
                background: 'linear-gradient(135deg, #868e96 0%, #495057 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                width: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              Cancel
            </button>
          </div>
        </PageContainer>
      )}

      {activeTab === 'scan' && scannedGear && (
        <PageContainer>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginTop: 0, fontSize: '22px', color: '#1a1a1a', fontWeight: '700' }}>
              Scanned Item
            </h2>
            
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '15px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#495057' }}>Band:</strong>
                <div style={{ marginTop: '4px', fontSize: '16px', color: '#1a1a1a', fontWeight: '600' }}>
                  {scannedGear.band_id}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#495057' }}>Description:</strong>
                <div style={{ marginTop: '4px', fontSize: '16px', color: '#1a1a1a', fontWeight: '600' }}>
                  {scannedGear.description}
                </div>
              </div>
              <div>
                <strong style={{ color: '#495057' }}>Status:</strong>
                <div style={{ marginTop: '8px' }}>
                  {scannedGear.checked_out ? (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #868e96 0%, #495057 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Checked Out to Band
                    </span>
                  ) : scannedGear.in_transit ? (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #ffa94d 0%, #fd7e14 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      In Transit
                    </span>
                  ) : scannedGear.current_location_id ? (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      At {locations.find(l => l.id === scannedGear.current_location_id)?.name || 'Unknown'}
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: '#e9ecef',
                      color: '#495057',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Not checked in yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            {scannedGear.checked_out ? (
              <div>
                <h3 style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: '700', marginBottom: '12px' }}>
                  Check Back In
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  Select location to check this item back in:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '16px',
                        minHeight: '56px',
                        backgroundColor: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      {loc.emoji && <span style={{ fontSize: '24px' }}>{loc.emoji}</span>}
                      <span>{loc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : scannedGear.in_transit ? (
              <div>
                <h3 style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: '700', marginBottom: '12px' }}>
                  Check IN to Location
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  Item is currently in transit. Select destination:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '16px',
                        minHeight: '56px',
                        backgroundColor: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      {loc.emoji && <span style={{ fontSize: '24px' }}>{loc.emoji}</span>}
                      <span>{loc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : scannedGear.current_location_id ? (
              <div>
                <h3 style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: '700', marginBottom: '16px' }}>
                  Check Out Options
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => handleCheckOut('transit')}
                    style={{
                      padding: '18px',
                      minHeight: '60px',
                      background: 'linear-gradient(135deg, #ffa94d 0%, #fd7e14 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(255, 169, 77, 0.3)'
                    }}
                  >
                    Check OUT (Moving within festival)
                  </button>
                  <button
                    onClick={() => handleCheckOut('band')}
                    style={{
                      padding: '18px',
                      minHeight: '60px',
                      background: 'linear-gradient(135deg, #868e96 0%, #495057 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(134, 142, 150, 0.3)'
                    }}
                  >
                    Check Out to Band (Off-site)
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: '700', marginBottom: '12px' }}>
                  Select Initial Location
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  This item hasn't been checked in yet. Select a location:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '16px',
                        minHeight: '56px',
                        backgroundColor: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      {loc.emoji && <span style={{ fontSize: '24px' }}>{loc.emoji}</span>}
                      <span>{loc.name}</span>
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
                padding: '16px',
                minHeight: '52px',
                background: '#e9ecef',
                color: '#495057',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
          </div>
        </PageContainer>
      )}
    </div>
  );
}

export default App;