import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useRole } from '../hooks/useRole';
import StowageCanvas from './StowageCanvas';
import ContainerConfig from './ContainerConfig';
import StowageItemModal from './StowageItemModal';

export default function StowagePlan() {
  const db = useDatabase();
  const { canManageLocations } = useRole();

  const [view, setView] = useState('overview'); // 'overview' or 'detail'
  const [containers, setContainers] = useState([]);
  const [stowageItems, setStowageItems] = useState([]);
  const [gear, setGear] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showContainerConfig, setShowContainerConfig] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalData, setItemModalData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [expandedBands, setExpandedBands] = useState({});
  const [stagedItems, setStagedItems] = useState([]);

  const loadData = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      console.log('🔄 LOADING STOWAGE DATA...');
      const [containersData, stowageData, gearData, locationsData] = await Promise.all([
        db.containers.toArray(),
        db.stowage_items.toArray(),
        db.gear.toArray(),
        db.locations.toArray()
      ]);

      console.log(`📦 Loaded ${stowageData.length} stowage items:`, stowageData.map(i => ({ id: i.id, gear_id: i.gear_id })));
      setContainers(containersData);
      setStowageItems(stowageData);
      setGear(gearData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading stowage data:', error);
      setMessage('Error loading stowage data');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveContainer = async (containerData) => {
    try {
      if (editingContainer) {
        await db.containers.update(editingContainer.id, containerData);
        // Optimistic update
        setContainers(prev => prev.map(c => c.id === editingContainer.id ? { ...c, ...containerData } : c));
        setMessage('Container updated successfully');
      } else {
        const id = await db.containers.add(containerData);
        // Optimistic update
        setContainers(prev => [...prev, { id, ...containerData }]);
        setMessage('Container created successfully');
      }
      setTimeout(() => setMessage(''), 3000);
      setShowContainerConfig(false);
      setEditingContainer(null);
    } catch (error) {
      console.error('Error saving container:', error);
      setMessage('Error saving container');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteContainer = async (container) => {
    if (!window.confirm(`Delete container "${container.name}"? This will remove all items in it.`)) {
      return;
    }

    try {
      // Optimistic updates first
      setStowageItems(prev => prev.filter(item => item.container_id !== container.id));
      setContainers(prev => prev.filter(c => c.id !== container.id));

      // If we're viewing this container, go back to overview
      if (selectedContainer?.id === container.id) {
        setView('overview');
        setSelectedContainer(null);
      }

      // Delete all stowage items in this container from DB
      const itemsInContainer = stowageItems.filter(item => item.container_id === container.id);
      await Promise.all(itemsInContainer.map(item => db.stowage_items.delete(item.id)));

      // Delete the container from DB
      await db.containers.delete(container.id);

      setMessage('Container deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting container:', error);
      setMessage('Error deleting container');
      setTimeout(() => setMessage(''), 3000);
      // Reload on error
      loadData();
    }
  };

  const handleItemDelete = async (item) => {
    // Skip temp items
    if (typeof item.id === 'string' && item.id.startsWith('temp_')) {
      setStowageItems(prev => prev.filter(i => i.id !== item.id));
      return;
    }

    // Optimistic removal
    setStowageItems(prev => prev.filter(i => i.id !== item.id));

    // Delete from database in background
    try {
      await db.stowage_items.delete(item.id);
    } catch (error) {
      console.error('Error deleting item:', error);
      // Reload on error to revert optimistic update
      loadData();
    }
  };

  const handleClearContainer = async () => {
    if (!window.confirm('Remove ALL items from this container?')) return;

    const itemsToDelete = stowageItems.filter(item => item.container_id === selectedContainer?.id);
    const tempItems = itemsToDelete.filter(item => typeof item.id === 'string' && item.id.startsWith('temp_'));
    const realItems = itemsToDelete.filter(item => !(typeof item.id === 'string' && item.id.startsWith('temp_')));

    console.log(`🗑️ CLEARING ${itemsToDelete.length} items (${tempItems.length} temp, ${realItems.length} real) from container`);

    // Optimistic removal - remove ALL items including temp
    setStowageItems(prev => prev.filter(item => item.container_id !== selectedContainer?.id));

    // Delete ALL items from database (including temp items that got saved with temp IDs)
    try {
      if (itemsToDelete.length > 0) {
        console.log(`🗑️ Attempting to delete ${itemsToDelete.length} items from Firestore...`);
        await Promise.all(itemsToDelete.map(item => db.stowage_items.delete(item.id).catch(err => {
          console.warn(`Failed to delete item ${item.id}:`, err.message);
        })));
        console.log(`✅ Successfully deleted ${itemsToDelete.length} items from database`);
      }
    } catch (error) {
      console.error('Error clearing container:', error);
      // Reload on error to revert optimistic update
      loadData();
    }
  };

  const handleCleanupStuckItems = async () => {
    if (!window.confirm('Remove all items from this container that don\'t belong here?\n(Items with missing gear or not at this location)')) return;

    try {
      const containerItems = stowageItems.filter(item => item.container_id === selectedContainer?.id);
      let cleaned = 0;

      for (const item of containerItems) {
        // Skip temp items
        if (typeof item.id === 'string' && item.id.startsWith('temp_')) {
          setStowageItems(prev => prev.filter(i => i.id !== item.id));
          cleaned++;
          continue;
        }

        const gearItem = gear.find(g => g.id === item.gear_id);

        // Delete if gear doesn't exist or isn't at this location
        if (!gearItem || gearItem.current_location_id !== selectedContainer?.location_id) {
          await db.stowage_items.delete(item.id);
          setStowageItems(prev => prev.filter(i => i.id !== item.id));
          cleaned++;
        }
      }

      setMessage(`Cleaned up ${cleaned} items`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error cleaning items:', error);
      setMessage('Error cleaning items');
      setTimeout(() => setMessage(''), 3000);
      // Reload on error to revert any partial updates
      loadData();
    }
  };

  const handleItemMove = async (itemId, newPosition) => {
    // Skip if temp ID (not yet saved)
    if (typeof itemId === 'string' && itemId.startsWith('temp_')) {
      console.log('Skipping move for temp item');
      return;
    }

    // Optimistic update
    setStowageItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...newPosition } : item
    ));

    // Save in background
    try {
      await db.stowage_items.update(itemId, newPosition);
    } catch (error) {
      console.error('Error moving item:', error);
      loadData(); // Reload on error to revert
    }
  };

  const handleAddNewItem = () => {
    setItemModalData({ existingItem: null });
    setShowItemModal(true);
  };

  const handleItemPlace = (newItemData) => {
    // Open modal with pre-filled data from drop
    setItemModalData({ existingItem: newItemData, isNewPlacement: true });
    setShowItemModal(true);
  };

  const handleSaveStowageItem = async (itemData) => {
    try {
      if (itemModalData.existingItem && itemModalData.existingItem.id && !itemModalData.isNewPlacement) {
        // Updating existing item
        await db.stowage_items.update(itemModalData.existingItem.id, itemData);
        // Optimistic update
        setStowageItems(prev => prev.map(item =>
          item.id === itemModalData.existingItem.id ? { ...item, ...itemData } : item
        ));
        setMessage('Item updated successfully');
      } else {
        // Adding new item
        const id = await db.stowage_items.add(itemData);
        // Optimistic update
        setStowageItems(prev => [...prev, { id, ...itemData }]);
        setMessage('Item placed successfully');
      }
      setTimeout(() => setMessage(''), 3000);
      setShowItemModal(false);
      setItemModalData(null);
    } catch (error) {
      console.error('Error saving stowage item:', error);
      setMessage('Error saving item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteStowageItem = async (item) => {
    try {
      // Optimistic update first
      setStowageItems(prev => prev.filter(i => i.id !== item.id));
      setShowItemModal(false);
      setItemModalData(null);

      // Delete from DB in background
      await db.stowage_items.delete(item.id);

      setMessage('Item removed successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting stowage item:', error);
      setMessage('Error removing item');
      setTimeout(() => setMessage(''), 3000);
      // Reload on error to revert optimistic update
      loadData();
    }
  };

  const getContainerFillInfo = (container) => {
    const itemsInContainer = stowageItems.filter(item => item.container_id === container.id);
    const totalCells = container.length * container.width;
    const occupiedCells = itemsInContainer.reduce((sum, item) => sum + (item.width * item.height), 0);
    const fillPercentage = totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0;

    return {
      itemCount: itemsInContainer.length,
      occupiedCells,
      totalCells,
      fillPercentage
    };
  };

  const getLocationInfo = (locationId) => {
    return locations.find(loc => loc.id === locationId);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const searchLower = term.toLowerCase();
    const results = [];

    // Search through all stowage items
    stowageItems.forEach(item => {
      const gearItem = gear.find(g => g.id === item.gear_id);
      const container = containers.find(c => c.id === item.container_id);

      if (gearItem && container) {
        const matchesDescription = gearItem.description.toLowerCase().includes(searchLower);
        const matchesBand = gearItem.band_id && gearItem.band_id.toLowerCase().includes(searchLower);
        const matchesId = String(gearItem.display_id || '').includes(searchLower);

        if (matchesDescription || matchesBand || matchesId) {
          results.push({
            id: item.id,
            gearId: gearItem.id,
            gearDescription: gearItem.description,
            gearDisplayId: gearItem.display_id,
            bandId: gearItem.band_id,
            containerId: container.id,
            containerName: container.name,
            locationId: container.location_id,
            x: item.x,
            y: item.y
          });
        }
      }
    });

    setSearchResults(results);
  };

  const navigateToItem = (result) => {
    const container = containers.find(c => c.id === result.containerId);
    if (container) {
      setSelectedContainer(container);
      setView('detail');
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const toggleBand = (bandId) => {
    setExpandedBands(prev => ({
      ...prev,
      [bandId]: !prev[bandId]
    }));
  };

  const toggleStageItem = (gearItem) => {
    setStagedItems(prev => {
      const exists = prev.find(item => item.id === gearItem.id);
      if (exists) {
        return prev.filter(item => item.id !== gearItem.id);
      } else {
        return [...prev, gearItem];
      }
    });
  };

  const handleStagedItemDrop = async (gearItem, dropPosition) => {
    // Remove from staging immediately
    setStagedItems(prev => prev.filter(item => item.id !== gearItem.id));

    // Generate temp ID
    const tempId = `temp_${Date.now()}`;
    console.log(`➕ PLACING item with temp ID: ${tempId}, gear_id: ${gearItem.id}`);

    // Create item on canvas
    const newItem = {
      id: tempId,
      gear_id: gearItem.id,
      x_position: dropPosition.xPercent,
      y_position: dropPosition.yPercent,
      z: 0,
      item_width: 2,
      item_length: 2,
      item_height: 1,
      container_id: selectedContainer.id
    };

    // Optimistic update - add to state immediately
    setStowageItems(prev => [...prev, newItem]);

    // Save to database in background
    try {
      console.log(`💾 Saving item to database...`, newItem);
      const id = await db.stowage_items.add(newItem);
      console.log(`✅ Item saved with real ID: ${id}`);
      // Update with real ID
      setStowageItems(prev => prev.map(item =>
        item.id === tempId ? { ...item, id } : item
      ));
      console.log(`🔄 Updated temp ID ${tempId} to real ID ${id}`);
    } catch (error) {
      console.error('❌ Error placing item:', error);
      // Remove from state if save failed
      setStowageItems(prev => prev.filter(item => item.id !== tempId));
    }
  };

  const styles = {
    container: {
      padding: '0'
    },
    header: {
      marginTop: 0,
      marginBottom: '24px',
      fontSize: '16px',
      color: '#ffa500',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      textAlign: 'center'
    },
    message: {
      padding: '16px',
      marginBottom: '20px',
      background: message.includes('Error') ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
      color: message.includes('Error') ? '#ff6b6b' : '#4caf50',
      border: `2px solid ${message.includes('Error') ? '#ff6b6b' : '#4caf50'}`,
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center'
    },
    viewToggle: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px'
    },
    viewButton: (isActive) => ({
      flex: 1,
      padding: '12px',
      background: isActive ? '#ffa500' : '#2d2d2d',
      color: isActive ? '#1a1a1a' : '#888',
      border: isActive ? 'none' : '2px solid #444',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }),
    addButton: {
      width: '100%',
      padding: '16px',
      background: '#ffa500',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '24px'
    },
    containerGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '20px',
      maxWidth: '100%'
    },
    containerCard: {
      background: '#2d2d2d',
      borderRadius: '8px',
      padding: '16px',
      border: '2px solid #664400',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '12px'
    },
    containerHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    },
    containerName: {
      fontSize: '16px',
      color: '#ffa500',
      fontWeight: '700',
      marginBottom: '4px'
    },
    containerLocation: {
      fontSize: '12px',
      color: '#888'
    },
    containerActions: {
      display: 'flex',
      gap: '8px'
    },
    iconButton: {
      background: 'transparent',
      border: 'none',
      color: '#ffa500',
      cursor: 'pointer',
      fontSize: '18px',
      padding: '4px'
    },
    containerInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      fontSize: '13px',
      color: '#888'
    },
    containerInfoItem: {
      color: '#ccc'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#888'
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '20px'
    },
    detailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      padding: '16px',
      background: '#2d2d2d',
      borderRadius: '8px',
      border: '2px solid #ffa500'
    },
    detailTitle: {
      fontSize: '18px',
      color: '#ffa500',
      fontWeight: '700'
    },
    detailSubtitle: {
      fontSize: '12px',
      color: '#888',
      marginTop: '4px'
    },
    backButton: {
      padding: '10px 16px',
      background: '#2d2d2d',
      color: '#ffa500',
      border: '2px solid #ffa500',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase'
    },
    bandSection: {
      marginBottom: '16px',
      background: '#2d2d2d',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    bandHeader: {
      padding: '12px 16px',
      background: '#1a1a1a',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    bandName: {
      color: '#ffa500',
      fontSize: '14px',
      fontWeight: '600'
    },
    bandGearList: {
      padding: '12px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    gearCheckbox: {
      padding: '12px 16px',
      background: '#1a1a1a',
      border: '2px solid #444',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#ccc',
      transition: 'all 0.2s',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center'
    },
    gearCheckboxSelected: {
      background: '#ffa500',
      color: '#1a1a1a',
      border: '2px solid #ffa500',
      fontWeight: '600'
    },
    stagingRow: {
      padding: '16px',
      background: '#2d2d2d',
      borderRadius: '6px',
      marginBottom: '16px',
      minHeight: '70px',
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    stagingLabel: {
      fontSize: '12px',
      color: '#888',
      marginRight: '12px'
    },
    stagedCard: {
      width: '80px',
      height: '80px',
      background: '#ffa500',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '700',
      color: '#1a1a1a',
      cursor: 'grab',
      border: '3px solid #ff8c00',
      touchAction: 'none'
    },
    gridWrapper: {
      display: 'flex',
      justifyContent: 'center',
      padding: '20px',
      background: '#1a1a1a',
      borderRadius: '12px',
      overflowX: 'auto',
      maxWidth: '100%',
      boxSizing: 'border-box'
    },
    filterBar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px',
      padding: '16px',
      background: '#2d2d2d',
      borderRadius: '8px',
      border: '2px solid #664400'
    },
    searchInput: {
      width: '100%',
      padding: '12px',
      background: '#1a1a1a',
      color: '#e0e0e0',
      border: '2px solid #444',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    filterSelect: {
      padding: '12px',
      background: '#1a1a1a',
      color: '#e0e0e0',
      border: '2px solid #444',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    searchResults: {
      marginTop: '12px',
      background: '#1a1a1a',
      borderRadius: '8px',
      border: '2px solid #ffa500',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    searchResult: {
      padding: '12px 16px',
      borderBottom: '1px solid #333',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    searchResultText: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    searchResultGear: {
      fontSize: '14px',
      color: '#ffa500',
      fontWeight: '600'
    },
    searchResultLocation: {
      fontSize: '12px',
      color: '#888'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Stowage Plan</h2>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📦 Stowage Plan</h2>

      {message && (
        <div style={styles.message}>{message}</div>
      )}

      {view === 'overview' ? (
        <>
          {canManageLocations && (
            <button
              onClick={() => {
                setEditingContainer(null);
                setShowContainerConfig(true);
              }}
              style={styles.addButton}
            >
              ➕ Add Container
            </button>
          )}

          {containers.length > 0 && (
            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="🔍 Find gear in containers (e.g., 'microphone', 'cable')..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={styles.searchInput}
              />

              {searchResults.length > 0 && (
                <div style={styles.searchResults}>
                  {searchResults.map(result => {
                    const location = getLocationInfo(result.locationId);
                    return (
                      <div
                        key={result.id}
                        style={styles.searchResult}
                        onClick={() => navigateToItem(result)}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d2d'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={styles.searchResultText}>
                          <div style={styles.searchResultGear}>
                            {result.gearDescription} {result.gearDisplayId && `(#${String(result.gearDisplayId).padStart(4, '0')})`}
                          </div>
                          <div style={styles.searchResultLocation}>
                            → {result.containerName} {location && `• ${location.emoji} ${location.name}`} • Position ({result.x}, {result.y})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.emoji} {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {containers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📦</div>
              <div style={{ fontSize: '18px', color: '#ffa500', fontWeight: '700', marginBottom: '12px' }}>
                No Containers Yet
              </div>
              <div style={{ fontSize: '14px', color: '#888' }}>
                {canManageLocations
                  ? 'Add a container to start planning your stowage'
                  : 'Ask an admin to add containers'}
              </div>
            </div>
          ) : (
            <>
              {(() => {
                // Filter containers based on location filter only
                const filteredContainers = containers.filter(container => {
                  // Location filter
                  if (filterLocation !== 'all' && container.location_id !== filterLocation) {
                    return false;
                  }

                  return true;
                });

                if (filteredContainers.length === 0) {
                  return (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>🔍</div>
                      <div style={{ fontSize: '18px', color: '#ffa500', fontWeight: '700', marginBottom: '12px' }}>
                        No Matching Containers
                      </div>
                      <div style={{ fontSize: '14px', color: '#888' }}>
                        Try adjusting your search or filter criteria
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={styles.containerGrid}>
                    {filteredContainers.map(container => {
                      const fillInfo = getContainerFillInfo(container);
                      const location = getLocationInfo(container.location_id);
                      const itemsForGrid = stowageItems.filter(item => item.container_id === container.id);

                      return (
                  <div
                    key={container.id}
                    style={styles.containerCard}
                    onClick={() => {
                      setSelectedContainer(container);
                      setView('detail');
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '2px solid #ffa500';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '2px solid #664400';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={styles.containerHeader}>
                      <div>
                        <div style={styles.containerName}>{container.name}</div>
                        <div style={styles.containerLocation}>
                          {location ? `${location.emoji} ${location.name}` : 'Unknown Location'}
                        </div>
                      </div>
                      {canManageLocations && (
                        <div style={styles.containerActions} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingContainer(container);
                              setShowContainerConfig(true);
                            }}
                            style={styles.iconButton}
                            title="Edit Container"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteContainer(container)}
                            style={{...styles.iconButton, color: '#ff6b6b'}}
                            title="Delete Container"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={styles.containerInfo}>
                      <span style={styles.containerInfoItem}>
                        {fillInfo.itemCount} items • {fillInfo.fillPercentage}% full
                      </span>
                      <span style={styles.containerInfoItem}>
                        {container.real_length && container.real_width
                          ? `${container.real_length}×${container.real_width}ft`
                          : `${container.length}×${container.width} cells`}
                      </span>
                    </div>
                  </div>
                );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </>
      ) : (
        <>
          <div style={styles.detailHeader}>
            <div>
              <div style={styles.detailTitle}>{selectedContainer?.name}</div>
              <div style={styles.detailSubtitle}>
                {getLocationInfo(selectedContainer?.location_id)?.name} •
                {selectedContainer?.real_length && selectedContainer?.real_width
                  ? ` ${selectedContainer.real_length}ft × ${selectedContainer.real_width}ft (${selectedContainer.length}×${selectedContainer.width} cells)`
                  : ` ${selectedContainer?.length}×${selectedContainer?.width} cells`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {canManageLocations && (
                <button
                  onClick={handleClearContainer}
                  style={{
                    ...styles.backButton,
                    background: '#2d2d2d',
                    color: '#ff6b6b',
                    border: '2px solid #ff6b6b'
                  }}
                >
                  🗑️ Clear All
                </button>
              )}
              <button
                onClick={() => {
                  setView('overview');
                  setSelectedContainer(null);
                }}
                style={styles.backButton}
              >
                ← Back
              </button>
            </div>
          </div>

          {canManageLocations && (
            <>
              {/* Collapsible Band List */}
              {(() => {
                // Get gear at this location that's available (not in transit, not checked out)
                const gearAtLocation = gear.filter(g =>
                  g.current_location_id === selectedContainer?.location_id &&
                  !g.in_transit &&
                  !g.checked_out
                );
                const bands = [...new Set(gearAtLocation.map(g => g.band_id).filter(Boolean))];
                const alreadyPlacedGearIds = stowageItems
                  .filter(si => si.container_id === selectedContainer?.id)
                  .map(si => si.gear_id);

                return bands.map(bandId => {
                  const bandGear = gearAtLocation.filter(g =>
                    g.band_id === bandId &&
                    !alreadyPlacedGearIds.includes(g.id)
                  );

                  if (bandGear.length === 0) return null;

                  const isExpanded = expandedBands[bandId];

                  return (
                    <div key={bandId} style={styles.bandSection}>
                      <div
                        style={styles.bandHeader}
                        onClick={() => toggleBand(bandId)}
                      >
                        <span style={styles.bandName}>{bandId}</span>
                        <span style={{ color: '#888', fontSize: '12px' }}>
                          {isExpanded ? '▼' : '▶'} {bandGear.length} items
                        </span>
                      </div>
                      {isExpanded && (
                        <div style={styles.bandGearList}>
                          {bandGear.map(gearItem => {
                            const isStaged = stagedItems.find(si => si.id === gearItem.id);
                            return (
                              <div
                                key={gearItem.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('direct_gear_id', gearItem.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                style={{
                                  ...styles.gearCheckbox,
                                  ...(isStaged ? styles.gearCheckboxSelected : {}),
                                  cursor: 'grab'
                                }}
                                onClick={() => toggleStageItem(gearItem)}
                              >
                                {gearItem.description}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Staging Row */}
              <div style={styles.stagingRow}>
                <span style={styles.stagingLabel}>
                  {stagedItems.length === 0 ? 'Select items above to stage' : 'Drag into container ↓'}
                </span>
                {stagedItems.map(gearItem => {
                  const initials = gearItem.band_id
                    ? gearItem.band_id.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()
                    : '??';

                  return (
                    <div
                      key={gearItem.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('staged_gear_id', gearItem.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      style={styles.stagedCard}
                      title={gearItem.description}
                    >
                      {initials}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <StowageCanvas
            container={selectedContainer}
            stowageItems={stowageItems.filter(item => {
              // Must be in this container
              if (item.container_id !== selectedContainer?.id) return false;

              // Get the gear to check its current location
              const gearItem = gear.find(g => g.id === item.gear_id);
              if (!gearItem) return false;

              // Only show if gear is currently at this container's location
              return gearItem.current_location_id === selectedContainer?.location_id;
            })}
            gear={gear}
            onItemDelete={canManageLocations ? handleItemDelete : null}
            onItemMove={canManageLocations ? handleItemMove : null}
            onStagedDrop={canManageLocations ? handleStagedItemDrop : null}
            stagedItems={stagedItems}
            readonly={!canManageLocations}
          />
        </>
      )}

      {showContainerConfig && (
        <ContainerConfig
          locations={locations}
          editingContainer={editingContainer}
          onSave={handleSaveContainer}
          onClose={() => {
            setShowContainerConfig(false);
            setEditingContainer(null);
          }}
        />
      )}

      {showItemModal && (
        <StowageItemModal
          x={itemModalData.x}
          y={itemModalData.y}
          container={selectedContainer}
          existingItem={itemModalData.existingItem}
          gear={gear}
          onSave={handleSaveStowageItem}
          onDelete={handleDeleteStowageItem}
          onClose={() => {
            setShowItemModal(false);
            setItemModalData(null);
          }}
        />
      )}
    </div>
  );
}
