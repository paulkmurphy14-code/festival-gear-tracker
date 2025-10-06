import { useState, useEffect, useCallback } from 'react';
import localDb from '../db';
import EditGear from './EditGear';

export default function GearList({ locationColors }) {
  const [gearItems, setGearItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [bands, setBands] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [printLayout, setPrintLayout] = useState('sheet');
  const [itemToPrint, setItemToPrint] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const items = await localDb.gear.toArray();
      const locs = await localDb.locations.toArray();
      const uniqueBands = [...new Set(items.map(item => item.band_id))].sort();

      setGearItems(items);
      setLocations(locs);
      setBands(uniqueBands);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const getTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const updated = new Date(date);
    const seconds = Math.floor((now - updated) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getLocationInfo = useCallback((locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return { name: 'Unknown', color: '#95a5a6' };
    return { name: location.name, color: location.color };
  }, [locations]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this item? This cannot be undone.');
    if (confirmed) {
      try {
        await localDb.gear.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting gear:', error);
        alert('Error deleting item');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleReprint = (item) => {
    setItemToPrint(item);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setItemToPrint(null);
      }, 500);
    }, 500);
  };

  const handleSaveEdit = async () => {
    setEditingItem(null);
    loadData();
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
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
        filtered = filtered.filter(item => !item.in_transit && !item.checked_out);
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

  const handlePrintSelected = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to print');
      return;
    }
    window.print();
  };

  const renderGearItem = (item) => {
    const locationInfo = getLocationInfo(item.current_location_id);
    const isSelected = selectedItems.includes(item.id);

    return (
      <div
        key={item.id}
        style={{
          padding: '20px',
          marginBottom: '12px',
          background: isSelected ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : 'white',
          borderRadius: '16px',
          border: isSelected ? '2px solid #0066cc' : '1px solid #e0e0e0',
          boxShadow: isSelected ? '0 4px 12px rgba(0,102,204,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectItem(item.id)}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  cursor: 'pointer',
                  accentColor: '#0066cc'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '18px', color: '#1a1a1a', marginBottom: '4px' }}>
                  {item.description}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {item.band_id} • ID: {item.id}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {item.checked_out ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #868e96 0%, #495057 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(134,142,150,0.3)'
                }}>
                  <span style={{ fontSize: '18px' }}>🎸</span>
                  <span>Checked Out to Band</span>
                </div>
              ) : item.in_transit ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #ffa94d 0%, #fd7e14 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(255,169,77,0.3)'
                }}>
                  <span style={{ fontSize: '18px' }}>🚚</span>
                  <span>In Transit</span>
                </div>
              ) : item.current_location_id ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${locationInfo.color} 0%, ${locationInfo.color}dd 100%)`,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: `0 2px 8px ${locationInfo.color}40`
                }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <span>{locationInfo.name}</span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '18px' }}>❓</span>
                  <span>Not Checked In</span>
                </div>
              )}

              {item.lastUpdated && (
                <span style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                  {getTimeAgo(item.lastUpdated)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '100px' }}>
            <button
              onClick={() => handleReprint(item)}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #cc5de8 0%, #9c36b5 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(204,93,232,0.3)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Reprint QR label"
            >
              🖨️ Print
            </button>
            <button
              onClick={() => handleEdit(item)}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(77,171,247,0.3)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(255,107,107,0.3)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (editingItem) {
    return (
      <EditGear
        item={editingItem}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '24px', 
          fontSize: '26px', 
          color: '#1a1a1a',
          fontWeight: '700'
        }}>
          Gear Inventory
        </h2>

        <div className="no-print">
          {/* Filter Section - same as before */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#495057'
            }}>
              Filter by:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterValue('');
                }}
                style={{
                  padding: '10px 20px',
                  background: filterType === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                  color: filterType === 'all' ? 'white' : '#495057',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: filterType === 'all' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Show All
              </button>
              <button
                onClick={() => {
                  setFilterType('band');
                  setFilterValue('');
                }}
                style={{
                  padding: '10px 20px',
                  background: filterType === 'band' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                  color: filterType === 'band' ? 'white' : '#495057',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: filterType === 'band' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                By Band
              </button>
              <button
                onClick={() => {
                  setFilterType('location');
                  setFilterValue('');
                }}
                style={{
                  padding: '10px 20px',
                  background: filterType === 'location' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                  color: filterType === 'location' ? 'white' : '#495057',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: filterType === 'location' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                By Location
              </button>
              <button
                onClick={() => {
                  setFilterType('status');
                  setFilterValue('');
                }}
                style={{
                  padding: '10px 20px',
                  background: filterType === 'status' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                  color: filterType === 'status' ? 'white' : '#495057',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: filterType === 'status' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                By Status
              </button>
            </div>

            {filterType === 'band' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
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
                <option value="">Select a band...</option>
                {bands.map(band => (
                  <option key={band} value={band}>{band}</option>
                ))}
              </select>
            )}

            {filterType === 'location' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
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
                <option value="">Select a location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            )}

            {filterType === 'status' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterValue('active')}
                  style={{
                    padding: '10px 20px',
                    background: filterValue === 'active' ? 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' : '#f8f9fa',
                    color: filterValue === 'active' ? 'white' : '#51cf66',
                    border: filterValue === 'active' ? 'none' : '2px solid #51cf66',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: filterValue === 'active' ? '0 2px 8px rgba(81,207,102,0.3)' : 'none'
                  }}
                >
                  📍 Active (at location)
                </button>
                <button
                  onClick={() => setFilterValue('in-transit')}
                  style={{
                    padding: '10px 20px',
                    background: filterValue === 'in-transit' ? 'linear-gradient(135deg, #ffa94d 0%, #fd7e14 100%)' : '#f8f9fa',
                    color: filterValue === 'in-transit' ? 'white' : '#ffa94d',
                    border: filterValue === 'in-transit' ? 'none' : '2px solid #ffa94d',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: filterValue === 'in-transit' ? '0 2px 8px rgba(255,169,77,0.3)' : 'none'
                  }}
                >
                  🚚 In Transit
                </button>
                <button
                  onClick={() => setFilterValue('checked-out')}
                  style={{
                    padding: '10px 20px',
                    background: filterValue === 'checked-out' ? 'linear-gradient(135deg, #868e96 0%, #495057 100%)' : '#f8f9fa',
                    color: filterValue === 'checked-out' ? 'white' : '#868e96',
                    border: filterValue === 'checked-out' ? 'none' : '2px solid #868e96',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: filterValue === 'checked-out' ? '0 2px 8px rgba(134,142,150,0.3)' : 'none'
                  }}
                >
                  🎸 Checked Out
                </button>
              </div>
            )}
          </div>

          {/* Bulk Selection */}
          {filterType !== 'all' && (
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSelectAllFiltered}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #cc5de8 0%, #9c36b5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(204,93,232,0.3)'
                }}
              >
                {selectedItems.length === filteredItems.length ? '✓ Deselect All' : '☐ Select All Filtered Items'}
              </button>
              {selectedItems.length > 0 && (
                <span style={{ 
                  padding: '8px 16px',
                  background: '#e3f2fd',
                  color: '#0066cc',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          )}

          {/* Print Selected Section */}
          {selectedItems.length > 0 && (
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '16px',
              marginBottom: '24px',
              border: '2px solid #0066cc'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: '16px',
                fontSize: '18px',
                color: '#1a1a1a',
                fontWeight: '700'
              }}>
                Print Selected Items ({selectedItems.length})
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '10px',
                  color: '#495057'
                }}>
                  Layout:
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPrintLayout('sheet')}
                    style={{
                      padding: '10px 20px',
                      background: printLayout === 'sheet' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                      color: printLayout === 'sheet' ? 'white' : '#495057',
                      border: printLayout === 'sheet' ? 'none' : '2px solid #dee2e6',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: printLayout === 'sheet' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
                    }}
                  >
                    Multiple per Sheet
                  </button>
                  <button
                    onClick={() => setPrintLayout('pages')}
                    style={{
                      padding: '10px 20px',
                      background: printLayout === 'pages' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                      color: printLayout === 'pages' ? 'white' : '#495057',
                      border: printLayout === 'pages' ? 'none' : '2px solid #dee2e6',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: printLayout === 'pages' ? '0 2px 8px rgba(102,126,234,0.3)' : 'none'
                    }}
                  >
                    One per Page
                  </button>
                </div>
              </div>
              <button
                onClick={handlePrintSelected}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(81,207,102,0.3)'
                }}
              >
                🖨️ Print {selectedItems.length} Label{selectedItems.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Item Count */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Total Items: {filteredItems.length}
            {filterType !== 'all' && ` (filtered from ${gearItems.length})`}
          </div>
        </div>
      </div>

      {/* Gear Items Display */}
      <div className="no-print">
        {Object.keys(groupedItems).length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <p style={{ fontSize: '18px', color: '#999', margin: 0 }}>
              No gear items found
              {filterType !== 'all' && ' matching your filter'}
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([bandName, items]) => (
            <div key={bandName} style={{ marginBottom: '24px' }}>
              <h3 style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '16px',
                marginBottom: '12px',
                fontSize: '20px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
              }}>
                {bandName} ({items.length} item{items.length !== 1 ? 's' : ''})
              </h3>
              {items.map(item => renderGearItem(item))}
            </div>
          ))
        )}
      </div>

      {/* Print View - Single Item Reprint */}
      {itemToPrint && (
        <div className="print-only">
          <div className="print-label-page">
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
              fontSize: '5mm',
              fontWeight: 'bold',
              marginBottom: '2mm',
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
              fontSize: '3.5mm',
              color: '#666',
              textAlign: 'center'
            }}>
              ID: {itemToPrint.id}
            </div>
          </div>
        </div>
      )}

      {/* Print View - Selected Items */}
      <div className="print-only">
        {selectedItems.map(itemId => {
          const item = gearItems.find(i => i.id === itemId);
          if (!item) return null;

          return (
            <div
              key={item.id}
              className={printLayout === 'sheet' ? 'print-label-small' : 'print-label-page'}
            >
              <img
                src={item.qr_code}
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
                {item.band_id}
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
          );
        })}
      </div>

     <style>{`
  @media print {
    body * { visibility: hidden; }
    .print-only, .print-only * { visibility: visible; }
    .print-only { position: absolute; left: 0; top: 0; }
    .no-print { display: none !important; }
    
    .print-label-page {
      display: block;
      width: 74mm;
      height: 105mm;
      padding: 5mm;
      box-sizing: border-box;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    
    @page {
      size: 74mm 105mm;
      margin: 0;
    }
  }
  
  @media screen {
    .print-only {
      display: none !important;
    }
  }
`}</style>
      )}
    </div>
  );
}