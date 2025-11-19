import Dexie from 'dexie';

export const db = new Dexie('FestivalGearDB');

db.version(12).stores({
  gear: '++id, band_id, qr_code, current_location_id, status, created_at, in_transit, checked_out, on_stage, lastUpdated',
  scans: '++id, gear_id, location_id, timestamp, synced',
  locations: '++id, name, type, color, emoji',
  bands: '++id, name',
  performances: '++id, band_id, location_id, date, time',
  syncQueue: '++id, type, data, timestamp, synced',
  containers: '++id, location_id, name, length, width, container_height',
  stowage_items: '++id, container_id, gear_id, x_position, y_position, z, item_width, item_length, item_height'
}).upgrade(tx => {
  // Migrate old grid-based items to percentage-based positioning
  return tx.table('stowage_items').toCollection().modify(item => {
    // If item has old x/y properties, don't migrate (will be handled by user)
    if (!item.hasOwnProperty('x_position')) {
      // Default to center of container if no old data
      item.x_position = 25; // 25% from left
      item.y_position = 25; // 25% from top
    }
    if (!item.hasOwnProperty('item_width')) {
      item.item_width = 2; // Default 2ft wide
    }
    if (!item.hasOwnProperty('item_length')) {
      item.item_length = 2; // Default 2ft long
    }
  });
}).upgrade(tx => {
  // Add container_height to existing containers (default 3 layers)
  return tx.table('containers').toCollection().modify(container => {
    if (!container.hasOwnProperty('container_height')) {
      container.container_height = 3;
    }
  });
}).upgrade(tx => {
  // Add z (layer) and item_height to existing stowage_items (default layer 0, height 1)
  return tx.table('stowage_items').toCollection().modify(item => {
    if (!item.hasOwnProperty('z')) {
      item.z = 0; // Ground layer
    }
    if (!item.hasOwnProperty('item_height')) {
      item.item_height = 1; // 1 layer tall
    }
  });
}).upgrade(tx => {
  // Add emoji field to existing locations
  return tx.table('locations').toCollection().modify(location => {
    if (!location.hasOwnProperty('emoji')) {
      location.emoji = '';
    }
  });
}).upgrade(tx => {
  // Add lastUpdated field to existing gear items
  return tx.table('gear').toCollection().modify(gear => {
    if (!gear.hasOwnProperty('lastUpdated')) {
      gear.lastUpdated = gear.created_at || new Date();
    }
  });
}).upgrade(tx => {
  // Add on_stage field to existing gear items
  return tx.table('gear').toCollection().modify(gear => {
    if (!gear.hasOwnProperty('on_stage')) {
      gear.on_stage = false;
    }
  });
});

// Initialize default locations with colors (on first run)
db.on('populate', () => {
  db.locations.bulkAdd([
    { id: 1, name: 'The Salty Dog', type: 'stage', color: '#e74c3c', emoji: '🎸' },
    { id: 2, name: 'Providencia', type: 'stage', color: '#3498db', emoji: '🎤' },
    { id: 3, name: 'Trailer Park', type: 'storage', color: '#f39c12', emoji: '🚐' },
    { id: 4, name: 'Survivor', type: 'transit', color: '#2ecc71', emoji: '🚢' },
    { id: 5, name: 'Band Registration Area', type: 'registration', color: '#9b59b6', emoji: '📝' }
  ]);
});

export default db;