import { useState, useEffect, useCallback } from 'react';
import RegisterGear from './components/RegisterGear';
import PreparedGate from './components/PreparedGate';
import GearList from './components/GearList';
import Scanner from './components/Scanner';
import Schedule from './components/Schedule';
import LocationManager from './components/LocationManager';
import UserManagement from './components/UserManagement';
import Messages from './components/Messages';
import MessageBar from './components/MessageBar';
import Reminders from './components/Reminders';
import StowagePlan from './components/StowagePlan';
import FestivalSelector from './components/FestivalSelector';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FestivalProvider, useFestival } from './contexts/FestivalContext';
import FestivalSetup from './components/FestivalSetup';
import Login from './components/Login';
import Signup from './components/Signup';
import { DatabaseProvider, useDatabase } from './contexts/DatabaseContext';
import { useRole } from './hooks/useRole';
import { db as firebaseDb } from './firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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

    /* Page width consistency */
    .page-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
    }

    /* Pulse animation for missing items */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);
      }
      50% {
        opacity: 0.85;
        box-shadow: 0 0 25px rgba(244, 67, 54, 0.5);
      }
    }
  `}</style>
);

function AppContent() {
  const { currentUser, logout } = useAuth();
  const { currentFestival, loading: festivalLoading, needsSelection, selectFestival } = useFestival();
  const db = useDatabase();
  const { canManageUsers, canBulkUploadCSV, canManageLocations } = useRole();

  const [showSignup, setShowSignup] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [scannedGear, setScannedGear] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationColors, setLocationColors] = useState({});
  const [message, setMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ active: 0, transit: 0, onStage: 0, checkedOut: 0, missing: 0 });
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeRemindersCount, setActiveRemindersCount] = useState(0);
  const [invitation, setInvitation] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalType, setInfoModalType] = useState(null);
  const [infoModalGear, setInfoModalGear] = useState([]);
  const [expandedInfoBands, setExpandedInfoBands] = useState({});

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
      const missing = allGear.filter(g => g.missing_status === 'missing').length;
      const onStage = allGear.filter(g => g.on_stage && g.missing_status !== 'missing').length;
      const transit = allGear.filter(g => g.in_transit && !g.on_stage && g.missing_status !== 'missing').length;
      const checkedOut = allGear.filter(g => g.checked_out && !g.on_stage && !g.in_transit && g.missing_status !== 'missing').length;
      const active = allGear.filter(g => !g.in_transit && !g.on_stage && !g.checked_out && g.current_location_id && g.missing_status !== 'missing').length;
      setStatusCounts({ active, transit, onStage, checkedOut, missing });
    } catch (error) {
      console.error('Error loading status counts:', error);
    }
  }, [db]);

  const loadUnreadCount = useCallback(async () => {
    if (!db || !currentUser) return;

    try {
      // Get all messages
      const allMessages = await db.messages.toArray();

      // Get read messages for current user
      const readMessages = await db.message_reads
        .where('user_id', '==', currentUser.uid)
        .toArray();

      const readMessageIds = new Set(readMessages.map(r => r.message_id));

      // Count unread
      const unreadCount = allMessages.filter(
        msg => !readMessageIds.has(msg.id)
      ).length;

      setUnreadMessagesCount(unreadCount);

    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [db, currentUser]);

  const loadActiveRemindersCount = useCallback(async () => {
    if (!db || !currentUser) return;

    try {
      const allReminders = await db.reminders.where('userId', '==', currentUser.uid).toArray();
      const activeCount = allReminders.filter(r => !r.completed).length;
      setActiveRemindersCount(activeCount);
    } catch (error) {
      console.error('Error loading reminders count:', error);
    }
  }, [db, currentUser]);


  useEffect(() => {
    loadLocations();
    loadStatusCounts();
    loadUnreadCount();
    loadActiveRemindersCount();
  }, [loadLocations, loadStatusCounts, loadUnreadCount, loadActiveRemindersCount, refreshTrigger]);

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

      // Auto-resolve if missing
      const wasMissing = scannedGear.missing_status === 'missing';
      if (wasMissing) {
        updateData.missing_status = 'active';
        updateData.missing_since = null;
        updateData.missing_reported_by = null;
        updateData.missing_last_location = null;
      }

      await db.gear.update(scannedGear.id, updateData);

      await db.scans.add({
        gear_id: scannedGear.id,
        location_id: locationId,
        scanned_at: new Date(),
        action: wasMissing ? 'missing_item_recovered' : 'check_in',
        user_email: currentUser?.email || 'unknown'
      });

      const locationName = locations.find(loc => loc.id === locationId)?.name || 'location';
      setMessage(wasMissing ? `✓ Missing item found! ${scannedGear.description} checked in to ${locationName}` : 'Item checked in successfully');
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
        on_stage: type === 'stage',
        checked_out: type === 'band',
        lastUpdated: new Date()
      };

      if (type === 'band') {
        updateData.current_location_id = null;
      }

      await db.gear.update(scannedGear.id, updateData);

      await db.scans.add({
        gear_id: scannedGear.id,
        location_id: scannedGear.current_location_id,
        scanned_at: new Date(),
        action: type === 'transit' ? 'check_out_transit' : type === 'stage' ? 'on_stage' : 'check_out_band',
        user_email: currentUser?.email || 'unknown'
      });

      const messageText = type === 'transit' ? 'Item in transit' : type === 'stage' ? 'Item on stage' : 'Item checked out to band';
      setMessage(messageText);
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

  const handleInfoBarClick = async (type) => {
    try {
      const allGear = await db.gear.toArray();
      let filtered = [];

      if (type === 'active') {
        filtered = allGear.filter(g => !g.in_transit && !g.on_stage && !g.checked_out && g.current_location_id && g.missing_status !== 'missing');
      } else if (type === 'transit') {
        filtered = allGear.filter(g => g.in_transit && !g.on_stage && g.missing_status !== 'missing');
      } else if (type === 'onStage') {
        filtered = allGear.filter(g => g.on_stage && g.missing_status !== 'missing');
      } else if (type === 'checkedOut') {
        filtered = allGear.filter(g => g.checked_out && !g.on_stage && !g.in_transit && g.missing_status !== 'missing');
      }

      setInfoModalGear(filtered);
      setInfoModalType(type);
      setShowInfoModal(true);
      setExpandedInfoBands({});
    } catch (error) {
      console.error('Error loading gear for modal:', error);
    }
  };

  // Check for invitation link on load
  useEffect(() => {
    const checkInvitation = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteId = urlParams.get('invite');

      if (inviteId) {
        try {
          const inviteDoc = await getDoc(doc(firebaseDb, 'invitations', inviteId));
          if (inviteDoc.exists() && inviteDoc.data().status === 'pending') {
            setInvitation({ id: inviteId, ...inviteDoc.data() });
            // Store in localStorage in case page refreshes
            localStorage.setItem('pendingInvitation', JSON.stringify({ id: inviteId, ...inviteDoc.data() }));
          }
        } catch (error) {
          console.error('Error fetching invitation:', error);
        }
      } else {
        // Check localStorage for pending invitation
        const storedInvite = localStorage.getItem('pendingInvitation');
        if (storedInvite) {
          setInvitation(JSON.parse(storedInvite));
        }
      }
    };

    checkInvitation();
  }, []);

  // Handle invitation acceptance after user logs in/signs up
  useEffect(() => {
    const acceptInvitation = async () => {
      if (!currentUser || !invitation) return;

      try {
        // Add user to the festival
        const userDocRef = doc(firebaseDb, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Update existing user to add new festival
          const userData = userDoc.data();
          let festivals = [];

          // Get existing festivals array or migrate from old schema
          if (userData.festivals && Array.isArray(userData.festivals)) {
            festivals = [...userData.festivals];
          } else if (userData.festivalId) {
            // Migrate old schema to new
            festivals = [{
              festivalId: userData.festivalId,
              role: userData.role || 'user'
            }];
          }

          // Check if user is already in this festival
          const existingIndex = festivals.findIndex(f => f.festivalId === invitation.festivalId);

          if (existingIndex >= 0) {
            // Update role if already in festival
            festivals[existingIndex].role = invitation.role;
          } else {
            // Add new festival
            festivals.push({
              festivalId: invitation.festivalId,
              role: invitation.role
            });
          }

          // Update with new schema and remove old fields
          await updateDoc(userDocRef, {
            festivals: festivals,
            festivalId: null,  // Remove old schema field
            role: null         // Remove old schema field
          });
        } else {
          // Create new user document with new schema
          await setDoc(userDocRef, {
            email: currentUser.email,
            festivals: [{
              festivalId: invitation.festivalId,
              role: invitation.role
            }],
            createdAt: new Date()
          });
        }

        // Mark invitation as accepted
        await updateDoc(doc(firebaseDb, 'invitations', invitation.id), {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: currentUser.uid
        });

        // Clear invitation
        setInvitation(null);
        localStorage.removeItem('pendingInvitation');

        // Remove invite param from URL
        window.history.replaceState({}, '', window.location.pathname);

        // Refresh to load new festival
        window.location.reload();

      } catch (error) {
        console.error('Error accepting invitation:', error);
      }
    };

    acceptInvitation();
  }, [currentUser, invitation]);

  if (!currentUser) {
    return showSignup ? (
      <Signup onSwitchToLogin={() => setShowSignup(false)} invitation={invitation} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignup(true)} invitation={invitation} />
    );
  }

  if (festivalLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Loading festival data...
      </div>
    );
  }

  // Show festival selector if user has multiple festivals
  if (needsSelection) {
    return <FestivalSelector user={currentUser} onSelectFestival={selectFestival} />;
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
      gap: '4px',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      padding: '4px 8px',
      borderRadius: '6px'
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
    notificationBadge: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: '#f44336',
      color: 'white',
      borderRadius: '12px',
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: '700',
      minWidth: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 6px rgba(244,67,54,0.4)'
    },
    floatingBackButton: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      cursor: 'pointer',
      fontSize: '24px',
      fontWeight: '700',
      boxShadow: '0 4px 12px rgba(255, 165, 0, 0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
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
    },
    missingAlertBanner: {
      padding: '16px',
      marginBottom: '20px',
      background: 'rgba(244, 67, 54, 0.2)',
      border: '2px solid #f44336',
      borderLeft: '4px solid #f44336',
      borderRadius: '6px',
      cursor: 'pointer',
      animation: 'pulse 2s ease-in-out infinite',
      transition: 'all 0.2s',
      textAlign: 'center'
    },
    missingAlertTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#ff6b6b',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    missingAlertItems: {
      fontSize: '13px',
      color: '#ccc',
      marginBottom: '8px'
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
          <div style={{
            fontSize: '14px',
            color: '#ffa500',
            fontWeight: '600',
            marginTop: '8px',
            padding: '8px 16px',
            background: 'rgba(255, 165, 0, 0.1)',
            borderRadius: '20px',
            display: 'inline-block',
            border: '1px solid rgba(255, 165, 0, 0.3)'
          }}>
            🎪 {currentFestival.name}
          </div>
        </div>

        {/* Message Bar - Scrollable notifications */}
        <MessageBar
          statusCounts={statusCounts}
          activeRemindersCount={activeRemindersCount}
          onMessageClick={(tab, filter) => {
            setActiveTab(tab);
            if (filter === 'missing') {
              // Store the filter to pass to GearList
              sessionStorage.setItem('gearListFilter', 'missing');
            }
            // Trigger refresh to update counts
            setTimeout(() => {
              setRefreshTrigger(prev => prev + 1);
            }, 500);
          }}
          key={refreshTrigger}
        />

        {/* Status Info Bar */}
        <div style={styles.infoBar}>
          <div style={styles.infoBarItem} onClick={() => handleInfoBarClick('active')}>
            <span style={styles.infoBarLabel}>Active</span>
            <span style={{ ...styles.infoBarCount, color: '#4caf50' }}>{statusCounts.active}</span>
          </div>
          <div style={styles.infoBarItem} onClick={() => handleInfoBarClick('transit')}>
            <span style={styles.infoBarLabel}>In Transit</span>
            <span style={{ ...styles.infoBarCount, color: '#ff6b6b' }}>{statusCounts.transit}</span>
          </div>
          <div style={styles.infoBarItem} onClick={() => handleInfoBarClick('onStage')}>
            <span style={styles.infoBarLabel}>On Stage</span>
            <span style={{ ...styles.infoBarCount, color: '#ffa500' }}>{statusCounts.onStage}</span>
          </div>
          <div style={styles.infoBarItem} onClick={() => handleInfoBarClick('checkedOut')}>
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

              <div style={styles.homeButton} onClick={() => setActiveTab('messages')}>
                <span style={styles.homeButtonIcon}>📨</span>
                <div style={styles.homeButtonText}>Messages</div>
                <div style={styles.homeButtonDesc}>Updates</div>
                {unreadMessagesCount > 0 && (
                  <div style={styles.notificationBadge}>
                    {unreadMessagesCount}
                  </div>
                )}
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('reminders')}>
                <span style={styles.homeButtonIcon}>⏰</span>
                <div style={styles.homeButtonText}>Reminders</div>
                <div style={styles.homeButtonDesc}>My Tasks</div>
                {activeRemindersCount > 0 && (
                  <div style={styles.notificationBadge}>
                    {activeRemindersCount}
                  </div>
                )}
              </div>

              <div style={styles.homeButton} onClick={() => setActiveTab('stowage')}>
                <span style={styles.homeButtonIcon}>📦</span>
                <div style={styles.homeButtonText}>Stowage</div>
                <div style={styles.homeButtonDesc}>Container Plan</div>
              </div>

              {canBulkUploadCSV && (
                <div style={styles.homeButton} onClick={() => setActiveTab('prepared')}>
                  <span style={styles.homeButtonIcon}>📄</span>
                  <div style={styles.homeButtonText}>Bulk Upload</div>
                  <div style={styles.homeButtonDesc}>CSV Import</div>
                </div>
              )}

              {canManageLocations && (
                <div style={styles.homeButton} onClick={() => setActiveTab('locations')}>
                  <span style={styles.homeButtonIcon}>📍</span>
                  <div style={styles.homeButtonText}>Locations</div>
                  <div style={styles.homeButtonDesc}>Manage</div>
                </div>
              )}

              {canManageUsers && (
                <div style={styles.homeButton} onClick={() => setActiveTab('users')}>
                  <span style={styles.homeButtonIcon}>👥</span>
                  <div style={styles.homeButtonText}>Users</div>
                  <div style={styles.homeButtonDesc}>Manage Team</div>
                </div>
              )}
            </div>

            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>

            <button
              onClick={() => {
                // Clear selected festival to show selector
                localStorage.removeItem(`selectedFestival_${currentUser.uid}`);
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2d2d2d',
                color: '#ffa500',
                border: '2px solid #ffa500',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginTop: '10px'
              }}
            >
              🔄 Switch Festival
            </button>
          </div>
        )}

        {/* Content Pages */}
        {activeTab === 'chaos' && (
          <>
            <RegisterGear
              locationColors={locationColors}
              onDataChange={() => setRefreshTrigger(prev => prev + 1)}
            />
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
          </>
        )}

        {activeTab === 'prepared' && canBulkUploadCSV && (
          <>
            <PreparedGate
              locationColors={locationColors}
              onDataChange={() => setRefreshTrigger(prev => prev + 1)}
            />
            <button
              style={styles.floatingBackButton}
              onClick={() => setActiveTab('home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            <Schedule key={refreshTrigger} locationColors={locationColors} />
            <button
              style={styles.floatingBackButton}
              onClick={() => setActiveTab('home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'gear' && (
          <>
            <GearList
              key={refreshTrigger}
              locationColors={locationColors}
              currentUser={currentUser}
              onDataChange={() => setRefreshTrigger(prev => prev + 1)}
            />
            <button
              style={styles.floatingBackButton}
              onClick={() => setActiveTab('home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'locations' && canManageLocations && (
          <>
            <LocationManager onUpdate={handleLocationsUpdate} />
            <button
              style={styles.floatingBackButton}
              onClick={() => setActiveTab('home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <UserManagement />
            <button
              style={styles.floatingBackButton}
              onClick={() => setActiveTab('home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'messages' && (
          <>
            <Messages />
            <button
              style={styles.floatingBackButton}
              onClick={() => {
                setActiveTab('home');
                loadUnreadCount(); // Refresh count when returning home
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'reminders' && (
          <>
            <Reminders key={refreshTrigger} />
            <button
              style={styles.floatingBackButton}
              onClick={() => {
                setActiveTab('home');
                loadActiveRemindersCount(); // Refresh count when returning home
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'stowage' && (
          <>
            <StowagePlan />
            <button
              style={styles.floatingBackButton}
              onClick={() => setActiveTab('home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 165, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.4)';
              }}
              title="Back to Home"
            >
              🏠
            </button>
          </>
        )}

        {activeTab === 'scanner' && (
          <>
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
          </>
        )}

        {activeTab === 'scanned' && scannedGear && (
         <>
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
                    onClick={() => handleCheckOut('stage')}
                    style={{
                      padding: '18px',
                      background: '#ffa500',
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
                    🎸 On Stage
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
                    🎤 Check Out to Band
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
          </>
        )}

        {/* Info Bar Modal */}
        {showInfoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowInfoModal(false)}
          >
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid #ffa500'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: '20px',
                borderBottom: '2px solid #664400',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#ffa500',
                  fontSize: '18px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {infoModalType === 'active' && 'Active Gear'}
                  {infoModalType === 'transit' && 'In Transit'}
                  {infoModalType === 'onStage' && 'On Stage 🎸'}
                  {infoModalType === 'checkedOut' && 'Checked Out'}
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffa500',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '30px',
                    height: '30px'
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1
              }}>
                {infoModalGear.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    No items in this status
                  </div>
                ) : (
                  (() => {
                    const groupedByBand = {};
                    infoModalGear.forEach(item => {
                      const bandKey = item.band_id || 'No Band';
                      if (!groupedByBand[bandKey]) {
                        groupedByBand[bandKey] = [];
                      }
                      groupedByBand[bandKey].push(item);
                    });

                    return Object.entries(groupedByBand).map(([bandName, items]) => (
                      <div key={bandName} style={{ marginBottom: '16px' }}>
                        <div
                          onClick={() => setExpandedInfoBands(prev => ({ ...prev, [bandName]: !prev[bandName] }))}
                          style={{
                            padding: '12px',
                            background: '#2d2d2d',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '2px solid #664400'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '14px', marginRight: '8px' }}>
                              {expandedInfoBands[bandName] ? '▼' : '▶'}
                            </span>
                            <span style={{ color: '#ffa500', fontWeight: '600', fontSize: '15px' }}>
                              {bandName}
                            </span>
                          </div>
                          <span style={{
                            background: 'rgba(255, 165, 0, 0.2)',
                            color: '#ffa500',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {items.length}
                          </span>
                        </div>
                        {expandedInfoBands[bandName] && (
                          <div style={{ marginTop: '8px', marginLeft: '20px' }}>
                            {items.map(item => (
                              <div key={item.id} style={{
                                padding: '10px',
                                background: '#2d2d2d',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                borderLeft: '3px solid #ffa500'
                              }}>
                                <div style={{ color: '#e0e0e0', fontSize: '14px', marginBottom: '4px' }}>
                                  {item.description}
                                </div>
                                <div style={{ color: '#888', fontSize: '12px' }}>
                                  ID: #{String(item.display_id || '0000').padStart(4, '0')}
                                  {item.current_location_id && infoModalType === 'active' && (
                                    <span style={{ marginLeft: '10px' }}>
                                      📍 {locations.find(loc => String(loc.id) === String(item.current_location_id))?.name || 'Unknown'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>
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