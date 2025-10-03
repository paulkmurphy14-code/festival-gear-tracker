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
    // Reload data every minute to keep it fresh
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
    if (!location) return { name: 'Unknown', color: '#95a5a6', emoji: '' };
    return {
      name: location.name,
      color: location.color,
      emoji: location.emoji || ''
    };
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
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Label - ${item.description}</title>
        <style>
          @page {
            size: 74mm 105mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .label {
            width: 74mm;
            height: 105mm;
            padding: 5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-code {
            width: 50mm;
            height: 50mm;
            margin-bottom: 3mm;
          }
          .band-name {
            font-size: 5mm;
            font-weight: bold;
            margin-bottom: 2mm;
            text-align: center;
            width: 100%;
          }
          .description {
            font-size: 4.5mm;
            margin-bottom: 2mm;
            text-align: center;
            width: 100%;
          }
          .id {
            font-size: 3.5mm;
            color: #666;
            text-align: center;
            width: 100%;
          }
          @media print {
            body {
              width: 74mm;
              height: 105mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${item.qr_code}" alt="QR Code" class="qr-code" />
          <div class="band-name">${item.band_id}</div>
          <div class="description">${item.description}</div>
          <div class="id">ID: ${item.id}</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
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

    let backgroundColor = 'white';
    if (isSelected) {
      backgroundColor = '#e3f2fd';
    } else if (item.in_transit) {
      backgroundColor = '#fff3e0';
    } else if (item.checked_out) {
      backgroundColor = '#f5f5f5';
    }

    return (
      <div
        key={item.id}
        style={{
          padding: '15px',
          marginBottom: '10px',
          backgroundColor: backgroundColor,
          borderRadius: '5px',
          border: isSelected ? '2px solid #0066cc' : '1px solid #ddd'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectItem(item.id)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {item.description}
              </span>
              <span style={{ fontSize: '12px', color: '#999' }}>
                ID: {item.id}
              </span>
            </div>
            <div style={{ marginLeft: '28px', marginBottom: '10px' }}>
              {item.checked_out ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  🎸 Checked Out to Band
                </span>
              ) : item.in_transit ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  🚚 In Transit
                </span>
              ) : item.current_location_id ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: locationInfo.color,
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {locationInfo.emoji && `${locationInfo.emoji} `}{locationInfo.name}
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: '#e0e0e0',
                    color: '#666',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                >
                  No location set
                </span>
              )}
              {item.lastUpdated && (
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                  {getTimeAgo(item.lastUpdated)}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleReprint(item)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              title="Reprint QR label"
            >
              🖨️ Print
            </button>
            <button
              onClick={() => handleEdit(item)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
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
      <h2 style={{ marginBottom: '20px' }}>Gear Inventory</h2>

      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong>Filter by:</strong>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button
            onClick={() => {
              setFilterType('all');
              setFilterValue('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: filterType === 'all' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'all' ? 'bold' : 'normal'
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
              backgroundColor: filterType === 'band' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'band' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'band' ? 'bold' : 'normal'
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
              backgroundColor: filterType === 'location' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'location' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'location' ? 'bold' : 'normal'
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
              backgroundColor: filterType === 'status' ? '#0066cc' : '#f0f0f0',
              color: filterType === 'status' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filterType === 'status' ? 'bold' : 'normal'
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
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ddd'
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
              padding: '10px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Select a location...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.emoji ? `${loc.emoji} ` : ''}{loc.name}
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
                backgroundColor: filterValue === 'active' ? '#2ecc71' : '#e8f5e9',
                color: filterValue === 'active' ? 'white' : '#2ecc71',
                border: '1px solid #2ecc71',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: filterValue === 'active' ? 'bold' : 'normal'
              }}
            >
              Active (at location)
            </button>
            <button
              onClick={() => setFilterValue('in-transit')}
              style={{
                padding: '10px 20px',
                backgroundColor: filterValue === 'in-transit' ? '#f39c12' : '#fff3e0',
                color: filterValue === 'in-transit' ? 'white' : '#f39c12',
                border: '1px solid #f39c12',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: filterValue === 'in-transit' ? 'bold' : 'normal'
              }}
            >
              In Transit
            </button>
            <button
              onClick={() => setFilterValue('checked-out')}
              style={{
                padding: '10px 20px',
                backgroundColor: filterValue === 'checked-out' ? '#95a5a6' : '#f5f5f5',
                color: filterValue === 'checked-out' ? 'white' : '#95a5a6',
                border: '1px solid #95a5a6',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: filterValue === 'checked-out' ? 'bold' : 'normal'
              }}
            >
              Checked Out
            </button>
          </div>
        )}
      </div>

      {filterType !== 'all' && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleSelectAllFiltered}
            style={{
              padding: '10px 20px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All Filtered Items'}
          </button>
          {selectedItems.length > 0 && (
            <span style={{ color: '#666' }}>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #0066cc'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
            Print Selected Items ({selectedItems.length})
          </h3>
          <div style={{ marginBottom: '15px' }}>
            <strong>Layout:</strong>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setPrintLayout('sheet')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: printLayout === 'sheet' ? '#0066cc' : '#f0f0f0',
                  color: printLayout === 'sheet' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: printLayout === 'sheet' ? 'bold' : 'normal'
                }}
              >
                Multiple per Sheet
              </button>
              <button
                onClick={() => setPrintLayout('pages')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: printLayout === 'pages' ? '#0066cc' : '#f0f0f0',
                  color: printLayout === 'pages' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: printLayout === 'pages' ? 'bold' : 'normal'
                }}
              >
                One per Page
              </button>
            </div>
          </div>
          <button
            onClick={handlePrintSelected}
            style={{
              padding: '15px 30px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🖨️ Print {selectedItems.length} Label{selectedItems.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      <div className="no-print">
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <strong>Total Items:</strong> {filteredItems.length}
          {filterType !== 'all' && ` (filtered from ${gearItems.length})`}
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}>
            <p style={{ fontSize: '18px', color: '#999' }}>
              No gear items found
              {filterType !== 'all' && ' matching your filter'}
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([bandName, items]) => (
            <div key={bandName} style={{ marginBottom: '30px' }}>
              <h3 style={{
                padding: '10px 15px',
                backgroundColor: '#0066cc',
                color: 'white',
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                {bandName} ({items.length} item{items.length !== 1 ? 's' : ''})
              </h3>
              {items.map(item => renderGearItem(item))}
            </div>
          ))
        )}
      </div>

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
  );
}