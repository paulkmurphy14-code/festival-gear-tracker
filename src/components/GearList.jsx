import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useRole } from '../hooks/useRole';
import EditGear from './EditGear';
import ScanHistory from './ScanHistory';
import { normalizeBandName } from '../utils/bandNormalization';

export default function GearList({ locationColors, currentUser, onDataChange }) {
  const db = useDatabase();
  const { canDeleteGear } = useRole();
  const [gearItems, setGearItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [bands, setBands] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [printLayout, setPrintLayout] = useState('sheet');
  const [itemToPrint, setItemToPrint] = useState(null);
  const [expandedBands, setExpandedBands] = useState({});
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [schedulePerformances, setSchedulePerformances] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await db.gear.toArray();
      const locs = await db.locations.toArray();
      const uniqueBands = [...new Set(items.map(item => item.band_id))].sort();

      setGearItems(items);
      setLocations(locs);
      setBands(uniqueBands);

      // Only initialize expanded state for NEW bands, preserve existing state
      setExpandedBands(prev => {
        const newExpanded = { ...prev };
        uniqueBands.forEach(band => {
          // Only add if this is a new band (not in prev state)
          if (!(band in newExpanded)) {
            newExpanded[band] = false;
          }
        });
        // Remove bands that no longer exist
        Object.keys(newExpanded).forEach(band => {
          if (!uniqueBands.includes(band)) {
            delete newExpanded[band];
          }
        });
        return newExpanded;
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Check for filter from message bar click
  useEffect(() => {
    const savedFilter = sessionStorage.getItem('gearListFilter');
    if (savedFilter === 'missing') {
      setFilterType('status');
      setFilterValue('missing');
      // Clear the filter from sessionStorage
      sessionStorage.removeItem('gearListFilter');
    }
  }, []);

  const getTimeAgo = (date) => {
    if (!date) return '';
    const updated = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - updated) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getLocationInfo = useCallback((locationId) => {
    // Handle both string and number IDs with loose comparison
    const location = locations.find(loc => loc.id == locationId);
    if (!location) return { name: 'Unknown', color: '#95a5a6' };
    return { name: location.name, color: location.color };
  }, [locations]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (confirmed) {
      try {
        await db.gear.delete(id);
        setSelectedItemDetail(null);
        loadData();
      } catch (error) {
        console.error('Error deleting gear:', error);
        alert('Error deleting item');
      }
    }
  };

  const handleMarkOnStage = async (item) => {
    const confirmed = window.confirm(
      `Mark ${item.description} as ON STAGE?`
    );

    if (!confirmed) return;

    try {
      await db.gear.update(item.id, {
        on_stage: !item.on_stage,
        lastUpdated: new Date()
      });

      await db.scans.add({
        gear_id: item.id,
        location_id: item.current_location_id,
        timestamp: new Date(),
        synced: false,
        user_id: 'manual_action',
        user_email: currentUser?.email || 'Unknown user',
        action: !item.on_stage ? 'mark_on_stage' : 'unmark_on_stage'
      });

      loadData();
      const updatedItem = await db.gear.get(item.id);
      if (updatedItem) {
        setSelectedItemDetail(updatedItem);
      }
      onDataChange?.();
    } catch (error) {
      console.error('Error marking item on stage:', error);
      alert('Error updating item status');
    }
  };

  const handleReportMissing = async (item) => {
    const confirmed = window.confirm(
      `Are you sure ${item.description} is missing?\n\nThis will alert all users to help find it.`
    );

    if (!confirmed) return;

    try {
      await db.gear.update(item.id, {
        missing_status: 'missing',
        missing_since: new Date(),
        missing_reported_by: currentUser?.email || 'Unknown',
        missing_last_location: item.current_location_id,
        lastUpdated: new Date()
      });

      await db.scans.add({
        gear_id: item.id,
        location_id: item.current_location_id,
        timestamp: new Date(),
        synced: false,
        user_id: 'missing_report',
        user_email: currentUser?.email || 'Unknown',
        action: 'reported_missing'
      });

      alert(`✓ ${item.description} marked as missing. Alert sent to all users.`);
      setSelectedItemDetail(null);
      loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Error reporting missing:', error);
      alert('Error reporting item as missing');
    }
  };

  const handleFoundIt = async (item) => {
    // Show location picker using window.prompt (simple version)
    const locationOptions = locations.map((loc, idx) => `${idx + 1}. ${loc.name}`).join('\n');
    const choice = window.prompt(
      `Where did you find ${item.description}?\n\n${locationOptions}\n\nEnter the number:`
    );

    if (!choice) return;

    const locationIndex = parseInt(choice) - 1;
    if (locationIndex < 0 || locationIndex >= locations.length) {
      alert('Invalid selection');
      return;
    }

    const selectedLocation = locations[locationIndex];

    try {
      await db.gear.update(item.id, {
        current_location_id: selectedLocation.id,
        missing_status: 'active',
        missing_since: null,
        missing_reported_by: null,
        missing_last_location: null,
        in_transit: false,
        checked_out: false,
        lastUpdated: new Date()
      });

      await db.scans.add({
        gear_id: item.id,
        location_id: selectedLocation.id,
        timestamp: new Date(),
        synced: false,
        user_id: 'found_missing',
        user_email: currentUser?.email || 'Unknown',
        action: 'found_missing_item'
      });

      alert(`✓ ${item.description} found! Checked in to ${selectedLocation.name}`);
      setSelectedItemDetail(null);
      loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Error marking found:', error);
      alert('Error marking item as found');
    }
  };

  const handleLocationUpdate = useCallback(async (itemId, newLocationId) => {
    try {
      // Keep location ID as-is (don't convert to number, IDs are strings in Firestore)
      const locationId = newLocationId;

      // Get location name BEFORE state updates
      const allLocations = await db.locations.toArray();
      const selectedLocation = allLocations.find(loc => loc.id === locationId);
      const locationName = selectedLocation ? selectedLocation.name : 'Unknown';

      // Get current item to check if missing
      const item = await db.gear.get(itemId);
      const wasMissing = item?.missing_status === 'missing';

      const updateData = {
        current_location_id: locationId,
        in_transit: false,
        on_stage: false,
        checked_out: false,
        lastUpdated: new Date()
      };

      // Auto-resolve if missing
      if (wasMissing) {
        updateData.missing_status = 'active';
        updateData.missing_since = null;
        updateData.missing_reported_by = null;
        updateData.missing_last_location = null;
      }

      await db.gear.update(itemId, updateData);

      await db.scans.add({
        gear_id: itemId,
        location_id: locationId,
        timestamp: new Date(),
        synced: false,
        user_id: 'manual_edit',
        user_email: currentUser?.email || 'Unknown user',
        action: wasMissing ? 'missing_item_recovered' : 'manual_location_change'
      });

      // Reload data and update the detail view with fresh data
      await loadData();

      // Get the updated item to show in detail view
      const updatedItem = await db.gear.get(itemId);
      if (updatedItem) {
        setSelectedItemDetail(updatedItem);
      }

      // Show success message with the location we fetched earlier
      alert(wasMissing ? `✓ Missing item found! Checked in to ${locationName}` : `Location updated to: ${locationName}`);
      onDataChange?.();
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Error updating location');
    }
  }, [db, currentUser, loadData, onDataChange]);

  const handleBulkCheckout = useCallback(async (type) => {
    if (selectedItems.length === 0) return;

    const confirmed = window.confirm(
      `Check out ${selectedItems.length} item(s) ${type === 'transit' ? 'for transit' : 'to band'}?`
    );

    if (!confirmed) return;

    try {
      for (const itemId of selectedItems) {
        const item = gearItems.find(i => i.id === itemId);
        if (!item) continue;

        if (type === 'transit') {
          await db.gear.update(itemId, {
            in_transit: true,
            lastUpdated: new Date()
          });

          await db.scans.add({
            gear_id: itemId,
            location_id: item.current_location_id,
            timestamp: new Date(),
            synced: false,
            user_id: 'bulk_action',
            user_email: currentUser?.email || 'Unknown user',
            action: 'bulk_check_out_transit'
          });
        } else if (type === 'band') {
          await db.gear.update(itemId, {
            checked_out: true,
            lastUpdated: new Date()
          });

          await db.scans.add({
            gear_id: itemId,
            location_id: item.current_location_id,
            timestamp: new Date(),
            synced: false,
            user_id: 'bulk_action',
            user_email: currentUser?.email || 'Unknown user',
            action: 'bulk_check_out_band'
          });
        }
      }

      setSelectedItems([]);
      loadData();
      onDataChange?.();
      alert(`${selectedItems.length} item(s) checked out successfully`);
    } catch (error) {
      console.error('Error with bulk checkout:', error);
      alert('Error checking out items');
    }
  }, [selectedItems, gearItems, db, currentUser, loadData, onDataChange]);
  
  const loadScanHistory = useCallback(async (gearId) => {
    try {
      const scans = await db.scans.where('gear_id', '==', gearId).toArray();
      scans.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timeB - timeA;
      });
      return scans;
    } catch (error) {
      console.error('Error loading scan history:', error);
      return [];
    }
  }, [db]);

  const handleBulkLocationChange = useCallback(async (newLocationId) => {
    if (selectedItems.length === 0) return;

    const locationName = getLocationInfo(newLocationId).name;
    const confirmed = window.confirm(
      `Move ${selectedItems.length} item(s) to ${locationName}?`
    );

    if (!confirmed) return;

    try {
      for (const itemId of selectedItems) {
        await db.gear.update(itemId, {
          current_location_id: newLocationId,
          in_transit: false,
          checked_out: false,
          lastUpdated: new Date()
        });

        await db.scans.add({
          gear_id: itemId,
          location_id: newLocationId,
          timestamp: new Date(),
          synced: false,
          user_id: 'bulk_action',
          user_email: currentUser?.email || 'Unknown user',
          action: 'bulk_location_change'
        });
      }

      setSelectedItems([]);
      loadData();
      onDataChange?.();
      alert(`${selectedItems.length} item(s) moved to ${locationName}`);
    } catch (error) {
      console.error('Error with bulk location change:', error);
      alert('Error moving items');
    }
  }, [selectedItems, db, getLocationInfo, currentUser, loadData, onDataChange]);

  const handleReprint = (item) => {
    setItemToPrint(item);
    const delay = /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? 2500 : 500;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setItemToPrint(null);
      }, delay);
    }, delay);
  };

  const handleSaveEdit = async () => {
    setEditingItem(null);
    setSelectedItemDetail(null);
    loadData();
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const toggleBand = (bandName) => {
    setExpandedBands(prev => ({
      ...prev,
      [bandName]: !prev[bandName]
    }));
  };

  const groupByBand = (items) => {
    const grouped = {};
    items.forEach(item => {
      // Use normalized for grouping key
      const normalized = item.band_id_normalized || normalizeBandName(item.band_id);

      if (!grouped[normalized]) {
        grouped[normalized] = {
          displayName: item.band_id, // Use first occurrence for display
          items: []
        };
      }

      grouped[normalized].items.push(item);
    });
    return grouped;
  };

  const handleViewSchedule = async (bandName) => {
    try {
      const normalized = normalizeBandName(bandName);

      // Get all performances for this band
      const allPerformances = await db.performances.toArray();
      const bandPerformances = allPerformances.filter(perf =>
        normalizeBandName(perf.band_id) === normalized
      );

      // Sort by date/time
      bandPerformances.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      setViewingSchedule(bandName);
      setSchedulePerformances(bandPerformances);

    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const closeScheduleModal = () => {
    setViewingSchedule(null);
    setSchedulePerformances([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getFilteredItems = useCallback(() => {
    let filtered = [...gearItems];

    if (filterType === 'band' && filterValue) {
      filtered = filtered.filter(item => item.band_id === filterValue);
    } else if (filterType === 'location' && filterValue) {
      filtered = filtered.filter(item => item.current_location_id == filterValue);
    } else if (filterType === 'status' && filterValue) {
      if (filterValue === 'active') {
        filtered = filtered.filter(item => !item.in_transit && !item.checked_out && item.current_location_id && item.missing_status !== 'missing');
      } else if (filterValue === 'missing') {
        filtered = filtered.filter(item => item.missing_status === 'missing');
      } else if (filterValue === 'in-transit') {
        filtered = filtered.filter(item => item.in_transit);
      } else if (filterValue === 'checked-out') {
        filtered = filtered.filter(item => item.checked_out);
      }
    }

    return filtered;
  }, [gearItems, filterType, filterValue]);

  const filteredItems = getFilteredItems();
  const groupedItems = groupByBand(filteredItems);

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map(item => item.id);
    if (selectedItems.length === allFilteredIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allFilteredIds);
    }
  };

  const getStatusBadge = (item) => {
    // Priority order: Missing > Transit > On Stage > Checked Out > Active
    if (item.missing_status === 'missing') {
      return { text: 'MISSING ⚠️', color: '#ff9800', bg: 'rgba(255, 152, 0, 0.2)', border: '#f57c00', pulse: true };
    } else if (item.in_transit) {
      return { text: 'IN TRANSIT', color: '#ff6b6b', bg: 'rgba(244, 67, 54, 0.2)', border: '#f44336', pulse: true };
    } else if (item.on_stage) {
      return { text: 'ON STAGE 🎸', color: '#ffa500', bg: 'rgba(255, 165, 0, 0.2)', border: '#ffa500', pulse: true };
    } else if (item.checked_out) {
      return { text: 'CHECKED OUT', color: '#888', bg: 'rgba(120, 120, 120, 0.15)', border: '#666', pulse: false };
    } else if (item.current_location_id) {
      const loc = getLocationInfo(item.current_location_id);
      return { text: loc.name.toUpperCase(), color: '#4caf50', bg: 'rgba(76, 175, 80, 0.15)', border: '#4caf50', pulse: false };
    } else {
      return { text: 'NO LOCATION', color: '#888', bg: 'rgba(120, 120, 120, 0.15)', border: '#666', pulse: false };
    }
  };

  const styles = {
    filters: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    filterBtn: (isActive) => ({
      flex: 1,
      minWidth: '80px',
      padding: '10px',
      background: isActive ? '#ffa500' : '#2d2d2d',
      border: isActive ? 'none' : '1px solid #444',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '12px',
      color: isActive ? '#1a1a1a' : '#999',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }),
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '2px solid #3a3a3a',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      marginBottom: '16px'
    },
    bandGroup: {
      background: '#2d2d2d',
      borderRadius: '6px',
      marginBottom: '12px',
      border: '1px solid #3a3a3a',
      overflow: 'hidden'
    },
    bandHeader: {
      padding: '14px 16px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#2d2d2d',
      borderLeft: '4px solid #ffa500'
    },
    bandName: {
      fontSize: '15px',
      color: '#ffa500',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    bandCount: {
      fontSize: '12px',
      color: '#888',
      background: '#1a1a1a',
      padding: '4px 10px',
      borderRadius: '3px'
    },
    scheduleIcon: {
      background: 'transparent',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.2s',
      minWidth: '0',
      minHeight: '0'
    },
    bandItems: {
      borderTop: '1px solid #3a3a3a'
    },
    gearItem: {
      padding: '12px 16px',
      borderBottom: '1px solid #3a3a3a',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    gearItemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    gearItemInfo: {
      flex: 1
    },
    gearItemDesc: {
      fontSize: '13px',
      color: '#ccc',
      marginBottom: '4px'
    },
    gearItemMeta: {
      fontSize: '11px',
      color: '#666'
    },
    badge: (badge) => ({
      padding: '8px 12px',
      background: badge.bg,
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      minWidth: '120px',
      textAlign: 'center',
      color: badge.color,
      borderLeft: `4px solid ${badge.border}`,
      paddingLeft: '8px',
      animation: badge.pulse ? 'pulse 2s ease-in-out infinite' : 'none',
      boxShadow: badge.pulse ? `0 0 12px ${badge.bg}` : 'none'
    }),
    scheduleModalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      zIndex: 1500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    scheduleModalCard: {
      background: '#2d2d2d',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '400px',
      width: '100%',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '2px solid #ffa500'
    },
    scheduleModalHeader: {
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '2px solid #3a3a3a'
    },
    scheduleModalTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '700',
      color: '#ffa500',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    scheduleModalContent: {
      marginBottom: '20px'
    },
    emptySchedule: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#888',
      fontSize: '14px'
    },
    schedulePerformanceCard: {
      padding: '12px',
      marginBottom: '12px',
      background: '#1a1a1a',
      borderRadius: '6px',
      border: '1px solid #3a3a3a',
      borderLeft: '4px solid #ffa500'
    },
    schedulePerfDate: {
      fontSize: '12px',
      color: '#888',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: '600'
    },
    schedulePerfDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    schedulePerfLocation: {
      fontSize: '15px',
      color: '#ffa500',
      fontWeight: '600'
    },
    schedulePerfTime: {
      fontSize: '14px',
      color: '#ccc',
      fontWeight: '600'
    },
    scheduleModalClose: {
      width: '100%',
      padding: '14px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    bulkActions: {
      background: '#2d2d2d',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '16px',
      border: '2px solid #ffa500',
      borderLeft: '4px solid #ffa500'
    },
    bulkTitle: {
      color: '#ffa500',
      fontSize: '14px',
      fontWeight: '700',
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    bulkButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginTop: '12px'
    },
    bulkBtn: {
      padding: '12px 16px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap'
    },
    bulkBtnSecondary: {
      padding: '12px 16px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap'
    },
    detailOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      overflow: 'auto',
      padding: '20px'
    },
    detailCard: {
      background: '#2d2d2d',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      border: '2px solid #ffa500'
    },
    detailTitle: {
      color: '#ffa500',
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    detailSection: {
      marginBottom: '20px'
    },
    detailLabel: {
      color: '#888',
      fontSize: '12px',
      fontWeight: '700',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    detailValue: {
      color: '#e0e0e0',
      fontSize: '16px',
      marginBottom: '4px'
    },
    detailButtons: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginTop: '20px'
    },
    detailBtn: {
      padding: '12px 20px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    closeBtn: {
      padding: '12px 20px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  };

  if (editingItem) {
    return <EditGear item={editingItem} onSave={handleSaveEdit} onCancel={handleCancelEdit} />;
  }

  if (viewingHistory) {
    return (
      <div>
        <ScanHistory 
          gearId={viewingHistory} 
          loadScanHistory={loadScanHistory} 
          getLocationInfo={getLocationInfo} 
        />
        <button
          onClick={() => setViewingHistory(null)}
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
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 12px rgba(244, 67, 54, 0.5);
          }
          50% {
            opacity: 0.85;
            box-shadow: 0 0 20px rgba(244, 67, 54, 0.8);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {isLoading && gearItems.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#888'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #664400',
            borderTop: '4px solid #ffa500',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffa500' }}>
            Loading gear list...
          </div>
        </div>
      ) : (
        <>
      {/* Missing Items Alert Banner */}
      {gearItems.filter(g => g.missing_status === 'missing').length > 0 && (
        <div
          style={{
            padding: '16px',
            marginBottom: '16px',
            background: 'rgba(244, 67, 54, 0.2)',
            border: '2px solid #f44336',
            borderLeft: '4px solid #f44336',
            borderRadius: '6px',
            cursor: 'pointer',
            animation: 'pulse 2s ease-in-out infinite',
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ff6b6b',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onClick={() => {
            setFilterType('status');
            setFilterValue('missing');
          }}
        >
          🚨 {gearItems.filter(g => g.missing_status === 'missing').length} ITEMS MISSING - Click to filter
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <button
          onClick={() => { setFilterType('all'); setFilterValue(''); }}
          style={styles.filterBtn(filterType === 'all')}
        >
          All
        </button>
        <button
          onClick={() => { setFilterType('band'); setFilterValue(''); }}
          style={styles.filterBtn(filterType === 'band')}
        >
          Band
        </button>
        <button
          onClick={() => { setFilterType('location'); setFilterValue(''); }}
          style={styles.filterBtn(filterType === 'location')}
        >
          Location
        </button>
        <button
          onClick={() => { setFilterType('status'); setFilterValue(''); }}
          style={styles.filterBtn(filterType === 'status')}
        >
          Status
        </button>
      </div>

      {filterType === 'band' && (
        <div>
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            style={styles.select}
          >
            <option value="">Select band...</option>
            {bands.map(band => (
              <option key={band} value={band}>{band}</option>
            ))}
          </select>
          {filterValue && (
            <button
              onClick={handleSelectAllFiltered}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ffa500',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px'
              }}
            >
              {selectedItems.length === filteredItems.length ? `Deselect All ${filterValue}` : `Select All ${filterValue}`}
            </button>
          )}
        </div>
      )}

      {filterType === 'location' && (
        <select
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          style={styles.select}
        >
          <option value="">Select location...</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      )}

      {filterType === 'status' && (
        <select
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          style={styles.select}
        >
          <option value="">Select status...</option>
          <option value="active">Active (At Location)</option>
          <option value="missing">Missing ⚠️</option>
          <option value="in-transit">In Transit</option>
          <option value="checked-out">Checked Out</option>
        </select>
      )}

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div style={styles.bulkActions}>
          <div style={styles.bulkTitle}>
            {selectedItems.length} Item(s) Selected
          </div>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleBulkLocationChange(e.target.value);
                e.target.value = '';
              }
            }}
            style={{ ...styles.select, width: '100%', marginTop: '8px' }}
          >
            <option value="">Move to Location...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <div style={styles.bulkButtons}>
            <button onClick={handleSelectAllFiltered} style={styles.bulkBtnSecondary}>
              {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <button onClick={() => handleBulkCheckout('transit')} style={styles.bulkBtn}>
              Transit
            </button>
            <button onClick={() => handleBulkCheckout('band')} style={styles.bulkBtn}>
              Check Out
            </button>
          </div>
        </div>
      )}

      {/* Band Groups */}
      {Object.entries(groupedItems).map(([normalizedKey, group]) => (
        <div key={normalizedKey} style={styles.bandGroup}>
          <div style={styles.bandHeader} onClick={() => toggleBand(normalizedKey)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={styles.bandName}>{group.displayName}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewSchedule(group.displayName);
                }}
                style={styles.scheduleIcon}
                title="View performance schedule"
              >
                📅
              </button>
            </div>
            <div style={styles.bandCount}>{group.items.length} Items</div>
          </div>
          {expandedBands[normalizedKey] && (
            <div style={styles.bandItems}>
              {group.items.map(item => {
                const badge = getStatusBadge(item);
                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.gearItem,
                      background: selectedItems.includes(item.id) ? '#3a3a3a' : 'transparent'
                    }}
                  >
                    <div style={styles.gearItemRow}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item.id);
                        }}
                        style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div 
                        style={{ ...styles.gearItemInfo, cursor: 'pointer' }}
                        onClick={() => setSelectedItemDetail(item)}
                      >
                        <div style={styles.gearItemDesc}>{item.description}</div>
                        <div style={styles.gearItemMeta}>
                          #{String(item.display_id || '0000').padStart(4, '0')} • {getTimeAgo(item.lastUpdated)}
                        </div>
                      </div>
                      <div style={styles.badge(badge)}>
                        {badge.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Item Detail Overlay */}
      {selectedItemDetail && (
        <div style={styles.detailOverlay} onClick={() => setSelectedItemDetail(null)}>
          <div style={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.detailTitle}>Item Details</h2>
            
            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Band</div>
              <div style={styles.detailValue}>{selectedItemDetail.band_id}</div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Description</div>
              <div style={styles.detailValue}>{selectedItemDetail.description}</div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Item ID</div>
              <div style={styles.detailValue}>
                #{String(selectedItemDetail.display_id || '0000').padStart(4, '0')}
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Status</div>
              <div style={styles.detailValue}>
                {getStatusBadge(selectedItemDetail).text}
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Last Updated</div>
              <div style={styles.detailValue}>{getTimeAgo(selectedItemDetail.lastUpdated)}</div>
            </div>

            {/* Missing Info */}
            {selectedItemDetail.missing_status === 'missing' && (
              <>
                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Missing Since</div>
                  <div style={styles.detailValue}>
                    {getTimeAgo(selectedItemDetail.missing_since)}
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Last Seen</div>
                  <div style={styles.detailValue}>
                    {selectedItemDetail.missing_last_location
                      ? getLocationInfo(selectedItemDetail.missing_last_location).name
                      : 'Unknown'}
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <div style={styles.detailLabel}>Reported By</div>
                  <div style={styles.detailValue}>
                    {selectedItemDetail.missing_reported_by || 'Unknown'}
                  </div>
                </div>
              </>
            )}

            <div style={styles.detailButtons}>
              {/* Location Change */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleLocationUpdate(selectedItemDetail.id, e.target.value);
                  }
                }}
                style={{ ...styles.select, width: '100%', marginBottom: '12px' }}
              >
                <option value="">Change Location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>

              {/* Primary Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setEditingItem(selectedItemDetail)} style={styles.detailBtn}>
                  Edit
                </button>
                <button onClick={() => handleReprint(selectedItemDetail)} style={styles.detailBtn}>
                  Print
                </button>
                <button onClick={() => setViewingHistory(selectedItemDetail.id)} style={styles.detailBtn}>
                  History
                </button>
                <button onClick={() => handleSelectItem(selectedItemDetail.id)} style={styles.detailBtn}>
                  {selectedItems.includes(selectedItemDetail.id) ? 'Deselect' : 'Select'}
                </button>
              </div>

              {/* Missing Item Actions */}
              {selectedItemDetail.missing_status === 'missing' ? (
                <button
                  onClick={() => handleFoundIt(selectedItemDetail)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#4caf50',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px'
                  }}
                >
                  ✓ I Found It
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleMarkOnStage(selectedItemDetail)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: selectedItemDetail.on_stage ? '#2d2d2d' : '#ffa500',
                      color: selectedItemDetail.on_stage ? '#ffa500' : '#1a1a1a',
                      border: selectedItemDetail.on_stage ? '2px solid #ffa500' : 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '8px'
                    }}
                  >
                    {selectedItemDetail.on_stage ? '✓ Remove from Stage' : '🎸 Mark On Stage'}
                  </button>
                  <button
                    onClick={() => handleReportMissing(selectedItemDetail)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#2d2d2d',
                      color: '#ff9800',
                      border: '2px solid #ff9800',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '8px'
                    }}
                  >
                    ⚠️ Report Missing
                  </button>
                </>
              )}

              {/* Destructive Actions */}
              {canDeleteGear && (
                <button
                  onClick={() => handleDelete(selectedItemDetail.id)}
                  style={{
                    ...styles.detailBtn,
                    background: '#2d2d2d',
                    color: '#ff6b6b',
                    border: '2px solid #ff6b6b',
                    width: '100%',
                    marginBottom: '8px'
                  }}
                >
                  Delete
                </button>
              )}

              <button onClick={() => setSelectedItemDetail(null)} style={styles.closeBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {viewingSchedule && (
        <div style={styles.scheduleModalOverlay} onClick={closeScheduleModal}>
          <div style={styles.scheduleModalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.scheduleModalHeader}>
              <h3 style={styles.scheduleModalTitle}>
                📅 {viewingSchedule} Schedule
              </h3>
            </div>

            <div style={styles.scheduleModalContent}>
              {schedulePerformances.length === 0 ? (
                <div style={styles.emptySchedule}>
                  No scheduled performances for this band
                </div>
              ) : (
                schedulePerformances.map((perf, idx) => {
                  const location = locations.find(l => String(l.id) === String(perf.location_id));
                  return (
                    <div key={idx} style={styles.schedulePerformanceCard}>
                      <div style={styles.schedulePerfDate}>
                        {formatDate(perf.date)}
                      </div>
                      <div style={styles.schedulePerfDetails}>
                        <div style={styles.schedulePerfLocation}>
                          {location?.name || 'Unknown Location'}
                        </div>
                        <div style={styles.schedulePerfTime}>
                          {formatTime(perf.time)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={closeScheduleModal} style={styles.scheduleModalClose}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Print Styles */}
      {itemToPrint && (
        <div className="print-only">
          <div className="print-label-small">
            <img
              src={itemToPrint.qr_code}
              alt={`QR Code for ${itemToPrint.description}`}
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
              {itemToPrint.band_id}
            </div>
            <div style={{
              fontSize: '4.5mm',
              marginBottom: '2mm',
              textAlign: 'center'
            }}>
              {itemToPrint.description}
            </div>
            <div style={{
              fontSize: '3mm',
              color: '#666',
              textAlign: 'center'
            }}>
              #{String(itemToPrint.display_id || '0000').padStart(4, '0')}
            </div>
          </div>
        </div>
      )}

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
            size: A4;
            margin: 8mm;
          }

          .print-label-small {
            display: inline-block;
            width: 90mm;
            padding: 5mm;
            margin: 2mm;
            box-sizing: border-box;
            vertical-align: top;
            page-break-inside: avoid;
          }
        }

        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
        </>
      )}
    </div>
  );
}