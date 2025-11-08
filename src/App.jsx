import { useState, useEffect, useCallback } from 'react';
import RegisterGear from './components/RegisterGear';
import PreparedGate from './components/PreparedGate';
import GearList from './components/GearList';
import Scanner from './components/Scanner';
import Schedule from './components/Schedule';
import LocationManager from './components/LocationManager';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FestivalProvider, useFestival } from './contexts/FestivalContext';
import FestivalSetup from './components/FestivalSetup';
import Login from './components/Login';
import Signup from './components/Signup';
import { DatabaseProvider, useDatabase } from './contexts/DatabaseContext';
import './App.css';

const GlobalStyles = () => (
  <style>{`
    body {
      font-size: 16px;
      line-height: 1.5;
      color: #e0e0e0;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      overflow-x: hidden;
      background-color: #1a1a1a;
    }
    
    * {
      box-sizing: border-box;
    }
    
    input, select, textarea {
      font-size: 16px !important;
      min-height: 44px;
      color: #e0e0e0 !important;
    }
    
    label {
      color: #ffa500 !important;
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

function AppContent() {
  const { currentUser, logout } = useAuth();
  const { currentFestival, loading: festivalLoading } = useFestival();
  const db = useDatabase();
  
  const [showSignup, setShowSignup] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [scannedGear, setScannedGear] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationColors, setLocationColors] = useState({});
  const [message, setMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ active: 0, transit: 0, checkedOut: 0 });

  const loadLocations = useCallback(async () => {
    if (!db) return;
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
  }, [db]);

  const loadStatusCounts = useCallback(async () => {
    if (!db) return;
    try {
      const allGear = await db.gear.toArray();
      const active = allGear.filter(g => !g.in_transit && !g.checked_out && g.current_location_id).length;
      const transit = allGear.filter(g => g.in_transit).length;
      const checkedOut = allGear.filter(g => g.checked_out).length;
      setStatusCounts({ active, transit, checkedOut });
    } catch (error) {
      console.error('Error loading status counts:', error);
    }
  }, [db]);

  useEffect(() => {
    loadLocations();
    loadStatusCounts();
  }, [loadLocations, loadStatusCounts, refreshTrigger]);

  const handleScan = useCallback(async (qrData) => {
    if (qrData && qrData.startsWith('GEAR:')) {
      const gearId = qrData.replace('GEAR:', '');
      try {
        const gear = await db.gear.get(gearId);
        if (gear) {
          setScannedGear(gear);
          setActiveTab('scanned');
        }
      } catch (error) {
        console.error('Error fetching gear:', error);
      }
    }
  }, [db]);

  const handleLocationSelect = async (locationId) => {
    if (!scannedGear) return;

    try {
      const updateData = {
        current_location_id: locationId,
        in_transit: false,
        checked_out: false,
        lastUpdated: new Date()
      };

      await db.gear.update(scannedGear.id, updateData);

      await db.scan_history.add({
        gear_id: scannedGear.id,
        location_id: locationId,
        scanned_at: new Date(),
        action: 'check_in',
        user_email: currentUser?.email || 'unknown'
      });

      setMessage('Item checked in successfully');
      setTimeout(() => setMessage(''), 3000);
      setScannedGear(null);
      setActiveTab('home');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating gear:', error);
      setMessage('Error checking in item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCheckOut = async (type) => {
    if (!scannedGear) return;

    try {
      const updateData = {
        in_transit: type === 'transit',
        checked_out: type === 'band',
        lastUpdated: new Date()
      };

      if (type === 'band') {
        updateData.current_location_id = null;
      }

      await db.gear.update(scannedGear.id, updateData);

      await db.scan_history.add({
        gear_id: scannedGear.id,
        location_id: scannedGear.current_location_id,
        scanned_at: new Date(),
        action: type === 'transit' ? 'check_out_transit' : 'check_out_band',
        user_email: currentUser?.email || 'unknown'
      });

      setMessage(type === 'transit' ? 'Item in transit' : 'Item checked out to band');
      setTimeout(() => setMessage(''), 3000);
      setScannedGear(null);
      setActiveTab('home');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error checking out:', error);
      setMessage('Error checking out item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLocationsUpdate = () => {
    loadLocations();
    setRefreshTrigger(prev => prev + 1);
  };

  if (!currentUser) {
    return showSignup ? <Signup onToggle={() => setShowSignup(false)} /> : <Login onToggle={() => setShowSignup(true)} />;
  }

  if (festivalLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Loading festival data...
      </div>
    );
  }

  if (!currentFestival) {
    return <FestivalSetup />;
  }

  const styles = {
    container: {
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '16px',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      background: '#2d2d2d',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px',
      borderLeft: '4px solid #ffa500',
      textAlign: 'center'
    },
    headerTitle: {
      fontSize: '16px',
      color: '#ffa500',
      marginBottom: '4px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1.2px',
      margin: 0
    },
    headerTagline: {
      fontSize: '11px',
      color: '#888',
      letterSpacing: '0.5px',
      margin: 0
    },
    infoBar: {
      background: '#2d2d2d',
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '16px',
      borderLeft: '4px solid #ffa500',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: '8px'
    },
    infoBarItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    },
    infoBarLabel: {
      color: '#888',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    infoBarCount: {
      fontSize: '16px',
      fontWeight: '700'
    },
    homeContent: {
      padding: '0'
    },
    homeButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      gridTemplateRows: 'repeat(3, 150px)'
    },
    homeButton: {
      background: '#2d2d2d',
      border: '2px solid #664400',
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s',
      position: 'relative',
      boxShadow: '0 3px 0 #664400, 0 5px 10px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px'
    },
    homeButtonIcon: {
      fontSize: '36px',
      marginBottom: '8px',
      display: 'block'
    },
    homeButtonText: {
      color: '#ffa500',
      fontSize: '15px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '4px'
    },
    homeButtonDesc: {
      color: '#666',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    logoutButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#2d2d2d',
      color: '#ff6b6b',
      border: '2px solid #ff6b6b',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      marginTop: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  };

  return (
    <div>
      <GlobalStyles />
      <div style={styles.container}>
        {/* Global Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Festival Gear Tracker</h1>
          <p style={styles.headerTagline}>Organising Chaos Like a Pro</p>
        </div>

        {/* Status Info Bar */}
        <div style={styles.infoBar}>
          <div style={styles.infoBarItem}>
            <span style={styles.infoBarLabel}>Active</span>
            <span style={{ ...styles.infoBarCount, color: '#4caf50' }}>{statusCounts.active}</span>
          </div>
          <div style={styles.infoBarItem}>
            <span style={styles.infoBarLabel}>In Transit</span>
            <span style={{ ...styles.infoBarCount, color: '#ff6b6b' }}>{statusCounts.transit}</span>
          </div>
          <div style={styles.infoBarItem}>
            <span style={styles.infoBarLabel}>Checked Out</span>
            <span style={{ ...styles.infoBarCount, color: '#888' }}>{statusCounts.checkedOut}</span>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '15px',
            marginBottom: '16px',
            backgroundColor: message.includes('Error') ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
            color: message.includes('Error') ? '#ff6b6b' : '#4caf50',
            borderRadius: '6px',
            border: `2px solid ${message.includes('Error') ? '#f44336' : '#4caf50'}`,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        {/* Home Page */}
        {activeTab === 'home' && (
          <div style={styles.homeContent}>
            <div style={styles.homeButtons}>
              <div style={styles.homeButton} onClick={() => setActiveTab('scanner')}>
                <span style={styles.homeButtonIcon}>📷</span>
                <div style={styles.homeButtonText}>Scan QR</div>
                <div style={styles.homeButtonDesc}>Check In/Out</div>
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('chaos')}>
                <span style={styles.homeButtonIcon}>➕</span>
                <div style={styles.homeButtonText}>Register</div>
                <div style={styles.homeButtonDesc}>Add Gear</div>
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('gear')}>
                <span style={styles.homeButtonIcon}>📋</span>
                <div style={styles.homeButtonText}>Gear List</div>
                <div style={styles.homeButtonDesc}>View All</div>
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('schedule')}>
                <span style={styles.homeButtonIcon}>📅</span>
                <div style={styles.homeButtonText}>Schedule</div>
                <div style={styles.homeButtonDesc}>Performances</div>
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('prepared')}>
                <span style={styles.homeButtonIcon}>📦</span>
                <div style={styles.homeButtonText}>Bulk Upload</div>
                <div style={styles.homeButtonDesc}>CSV Import</div>
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('locations')}>
                <span style={styles.homeButtonIcon}>📍</span>
                <div style={styles.homeButtonText}>Locations</div>
                <div style={styles.homeButtonDesc}>Manage</div>
              </div>
            </div>

            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        )}

        {/* Content Pages */}
        {activeTab === 'chaos' && (
          <div>
            <RegisterGear locationColors={locationColors} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {activeTab === 'prepared' && (
          <div>
            <PreparedGate locationColors={locationColors} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <Schedule key={refreshTrigger} locationColors={locationColors} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {activeTab === 'gear' && (
          <div>
            <GearList key={refreshTrigger} locationColors={locationColors} currentUser={currentUser} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {activeTab === 'locations' && (
          <div>
            <LocationManager onUpdate={handleLocationsUpdate} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div>
            <Scanner onScan={handleScan} />
            <button
              onClick={() => setActiveTab('home')}
              style={{
                marginTop: '20px',
                padding: '16px',
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {activeTab === 'scanned' && scannedGear && (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#2d2d2d',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #3a3a3a'
            }}>
              <h3 style={{
                fontSize: '18px',
                color: '#ffa500',
                fontWeight: '700',
                marginBottom: '12px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Scanned Item
              </h3>
              <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '8px' }}>
                <strong>Band:</strong> {scannedGear.band_id}
              </div>
              <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '8px' }}>
                <strong>Item:</strong> {scannedGear.description}
              </div>
              <div style={{ fontSize: '14px', color: '#888' }}>
                ID: #{String(scannedGear.display_id || '0000').padStart(4, '0')}
              </div>
            </div>

            {scannedGear.checked_out ? (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffa500',
                  fontWeight: '700',
                  marginBottom: '16px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Check IN to Location
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#888',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Item is checked out. Select destination:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '16px',
                        background: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : scannedGear.in_transit ? (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffa500',
                  fontWeight: '700',
                  marginBottom: '16px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Check IN to Location
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#888',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Item is in transit. Select destination:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '16px',
                        background: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : scannedGear.current_location_id ? (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffa500',
                  fontWeight: '700',
                  marginBottom: '16px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Check Out Options
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => handleCheckOut('transit')}
                    style={{
                      padding: '18px',
                      background: '#ff6b6b',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    🚚 In Transit (Moving)
                  </button>
                  <button
                    onClick={() => handleCheckOut('band')}
                    style={{
                      padding: '18px',
                      background: '#888',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    🎸 Check Out to Band
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffa500',
                  fontWeight: '700',
                  marginBottom: '16px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Select Initial Location
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#888',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  This item hasn't been checked in yet. Select a location:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc.id)}
                      style={{
                        padding: '16px',
                        background: loc.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      {loc.name}
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
                background: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
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

function App() {
  return (
    <AuthProvider>
      <FestivalProvider>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </FestivalProvider>
    </AuthProvider>
  );
}

export default App;