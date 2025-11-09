import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import EditGear from './EditGear';
import ScanHistory from './ScanHistory';

export default function GearList({ locationColors, currentUser }) {
  const db = useDatabase();
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

  const loadData = useCallback(async () => {
    try {
      const items = await db.gear.toArray();
      const locs = await db.locations.toArray();
      const uniqueBands = [...new Set(items.map(item => item.band_id))].sort();

      setGearItems(items);
      setLocations(locs);
      setBands(uniqueBands);
      
      // Start with all bands collapsed
      const expanded = {};
      uniqueBands.forEach(band => {
        expanded[band] = false;
      });
      setExpandedBands(expanded);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [db]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

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
    const location = locations.find(loc => loc.id === locationId);
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

  const handleLocationUpdate = useCallback(async (itemId, newLocationId) => {
    try {
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
        user_id: 'manual_edit',
        user_email: currentUser?.email || 'Unknown user',
        action: 'manual_location_change'
      });

      setSelectedItemDetail(null);
      loadData();
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Error updating location');
    }
  }, [db, currentUser, loadData]);

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
      alert(`${selectedItems.length} item(s) checked out successfully`);
    } catch (error) {
      console.error('Error with bulk checkout:', error);
      alert('Error checking out items');
    }
  }, [selectedItems, gearItems, db, currentUser, loadData]);
  
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
      alert(`${selectedItems.length} item(s) moved to ${locationName}`);
    } catch (error) {
      console.error('Error with bulk location change:', error);
      alert('Error moving items');
    }
  }, [selectedItems, db, getLocationInfo, currentUser, loadData]);

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
      if (!grouped[item.band_id]) {
        grouped[item.band_id] = [];
      }
      grouped[item.band_id].push(item);
    });
    return grouped;
  };

  const getFilteredItems = useCallback(() => {
    let filtered = [...gearItems];

    if (filterType === 'band' && filterValue) {
      filtered = filtered.filter(item => item.band_id === filterValue);
    } else if (filterType === 'location' && filterValue) {
      filtered = filtered.filter(item => item.current_location_id === parseInt(filterValue));
    } else if (filterType === 'status' && filterValue) {
      if (filterValue === 'active') {
        filtered = filtered.filter(item => !item.in_transit && !item.checked_out && item.current_location_id);
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
    if (item.in_transit) {
      return { text: 'IN TRANSIT', color: '#ff6b6b', bg: 'rgba(244, 67, 54, 0.2)', border: '#f44336', pulse: true };
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
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    bulkBtn: {
      padding: '10px 16px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
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
      `}</style>

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
          <div style={styles.bulkButtons}>
            <button onClick={handleSelectAllFiltered} style={styles.bulkBtn}>
              {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <button onClick={() => handleBulkCheckout('transit')} style={styles.bulkBtn}>
              Check Out (Transit)
            </button>
            <button onClick={() => handleBulkCheckout('band')} style={styles.bulkBtn}>
              Check Out (Band)
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkLocationChange(parseInt(e.target.value));
                  e.target.value = '';
                }
              }}
              style={{ ...styles.select, flex: 1, minWidth: '150px' }}
            >
              <option value="">Move to Location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Band Groups */}
      {Object.entries(groupedItems).map(([bandName, items]) => (
        <div key={bandName} style={styles.bandGroup}>
          <div style={styles.bandHeader} onClick={() => toggleBand(bandName)}>
            <h3 style={styles.bandName}>{bandName}</h3>
            <div style={styles.bandCount}>{items.length} Items</div>
          </div>
          {expandedBands[bandName] && (
            <div style={styles.bandItems}>
              {items.map(item => {
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

            <div style={styles.detailButtons}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleLocationUpdate(selectedItemDetail.id, parseInt(e.target.value));
                  }
                }}
                style={{ ...styles.select, width: '100%', marginBottom: '10px' }}
              >
                <option value="">Change Location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>

              <button onClick={() => handleSelectItem(selectedItemDetail.id)} style={styles.detailBtn}>
                {selectedItems.includes(selectedItemDetail.id) ? 'Deselect' : 'Select'}
              </button>
              <button onClick={() => setEditingItem(selectedItemDetail)} style={styles.detailBtn}>
                Edit
              </button>
              <button onClick={() => handleReprint(selectedItemDetail)} style={styles.detailBtn}>
                Print Label
              </button>
              <button onClick={() => setViewingHistory(selectedItemDetail.id)} style={styles.detailBtn}>
                History
              </button>
              <button onClick={() => handleDelete(selectedItemDetail.id)} style={{ ...styles.detailBtn, background: '#ff6b6b' }}>
                Delete
              </button>
              <button onClick={() => setSelectedItemDetail(null)} style={styles.closeBtn}>
                Close
              </button>
            </div>
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
    </div>
  );
}