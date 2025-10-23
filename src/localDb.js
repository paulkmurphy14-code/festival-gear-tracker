import Dexie from 'dexie';

export const db = new Dexie('FestivalGearDB');

db.version(8).stores({
  gear: '++id, band_id, qr_code, current_location_id, status, created_at, in_transit, checked_out, lastUpdated',
  scans: '++id, gear_id, location_id, timestamp, synced',
  locations: '++id, name, type, color, emoji',
  bands: '++id, name',
  performances: '++id, band_id, location_id, date, time',
  syncQueue: '++id, type, data, timestamp, synced'
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