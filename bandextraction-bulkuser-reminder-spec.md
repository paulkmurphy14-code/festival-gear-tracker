\## \*\*📋 COMPLETE SPECIFICATIONS - THREE FEATURES\*\*



---



\# \*\*FEATURE 1: BAND REGISTRY FROM SCHEDULE\*\*



\## \*\*🎯 OVERVIEW\*\*



Extract band names from schedule CSV upload to create an authoritative band registry. This registry powers autocomplete in gear registration and prevents duplicate band names.



---



\## \*\*🗄️ DATABASE STRUCTURE\*\*



\### \*\*New Collection: `festivals/{festivalId}/bands`\*\*



```javascript

{

&nbsp; id: "band\_abc123",

&nbsp; name: "The Script",                   // Display name (as in schedule)

&nbsp; name\_normalized: "script",             // Lowercase, no "the/a/an"

&nbsp; source: "schedule" | "manual",         // Where it came from

&nbsp; created\_at: timestamp,

&nbsp; performance\_count: 3                   // Cached count (optional)

}

```



\### \*\*Update firestoreDb.js:\*\*



```javascript

bands: {

&nbsp; async add(data) {

&nbsp;   const docRef = await addDoc(collection(db, `festivals/${festivalId}/bands`), data);

&nbsp;   return docRef.id;

&nbsp; },

&nbsp; 

&nbsp; async toArray() {

&nbsp;   const snapshot = await getDocs(collection(db, `festivals/${festivalId}/bands`));

&nbsp;   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

&nbsp; },

&nbsp; 

&nbsp; async delete(id) {

&nbsp;   await deleteDoc(doc(db, `festivals/${festivalId}/bands`, String(id)));

&nbsp; },

&nbsp; 

&nbsp; where(field, operator, value) {

&nbsp;   return {

&nbsp;     async toArray() {

&nbsp;       const q = query(

&nbsp;         collection(db, `festivals/${festivalId}/bands`),

&nbsp;         fbWhere(field, operator === 'equals' ? '==' : operator, value)

&nbsp;       );

&nbsp;       const snapshot = await getDocs(q);

&nbsp;       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

&nbsp;     }

&nbsp;   };

&nbsp; }

}

```



---



\## \*\*🔧 BAND NORMALIZATION UTILITY\*\*



\### \*\*Create: `/src/utils/bandNormalization.js`\*\*



```javascript

/\*\*

&nbsp;\* Normalize band name for matching/grouping

&nbsp;\* Removes articles, special chars, normalizes spaces

&nbsp;\* 

&nbsp;\* Examples:

&nbsp;\* "The Script" → "script"

&nbsp;\* "A Perfect Circle" → "perfect circle"

&nbsp;\* "The Rolling Stones!" → "rolling stones"

&nbsp;\*/

export function normalizeBandName(name) {

&nbsp; if (!name) return '';

&nbsp; 

&nbsp; return name

&nbsp;   .toLowerCase()

&nbsp;   .replace(/^the\\s+/i, '')      // Remove "The" from start

&nbsp;   .replace(/^a\\s+/i, '')        // Remove "A" from start

&nbsp;   .replace(/^an\\s+/i, '')       // Remove "An" from start

&nbsp;   .replace(/\[^\\w\\s]/g, '')      // Remove special characters

&nbsp;   .replace(/\\s+/g, ' ')         // Normalize multiple spaces to single

&nbsp;   .trim();

}



/\*\*

&nbsp;\* Check if two band names match (normalized comparison)

&nbsp;\*/

export function bandNamesMatch(name1, name2) {

&nbsp; return normalizeBandName(name1) === normalizeBandName(name2);

}

```



---



\## \*\*📤 SCHEDULE CSV UPLOAD - EXTRACT BANDS\*\*



\### \*\*Update Schedule.jsx:\*\*



\*\*Add band extraction to CSV parsing:\*\*



```javascript

import { normalizeBandName } from '../utils/bandNormalization';



const handleCSVUpload = async (file) => {

&nbsp; try {

&nbsp;   setUploading(true);

&nbsp;   setMessage('');

&nbsp;   

&nbsp;   const text = await file.text();

&nbsp;   const lines = text.split('\\n').filter(line => line.trim());

&nbsp;   

&nbsp;   if (lines.length === 0) {

&nbsp;     setMessage('⚠️ CSV file is empty');

&nbsp;     return;

&nbsp;   }

&nbsp;   

&nbsp;   // Detect format and parse

&nbsp;   const performances = \[];

&nbsp;   const bandNames = new Set(); // 🆕 Collect unique bands

&nbsp;   const stageNames = new Set(); // 🆕 Collect unique stages

&nbsp;   

&nbsp;   // ... existing CSV parsing logic ...

&nbsp;   

&nbsp;   lines.forEach((line, index) => {

&nbsp;     const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

&nbsp;     

&nbsp;     if (parts.length < 4) return;

&nbsp;     

&nbsp;     const \[day, stage, band, time] = parts;

&nbsp;     

&nbsp;     // 🆕 Collect band and stage

&nbsp;     if (band \&\& band.trim()) {

&nbsp;       bandNames.add(band.trim());

&nbsp;     }

&nbsp;     

&nbsp;     if (stage \&\& stage.trim()) {

&nbsp;       stageNames.add(stage.trim());

&nbsp;     }

&nbsp;     

&nbsp;     // ... rest of performance parsing ...

&nbsp;     performances.push({

&nbsp;       day,

&nbsp;       stage,

&nbsp;       band\_id: band.trim(),

&nbsp;       time

&nbsp;     });

&nbsp;   });

&nbsp;   

&nbsp;   // 🆕 Save band registry

&nbsp;   await saveBandRegistry(Array.from(bandNames));

&nbsp;   

&nbsp;   // 🆕 Optionally: Auto-create locations from stages

&nbsp;   await createLocationsFromStages(Array.from(stageNames));

&nbsp;   

&nbsp;   // Save performances (existing logic)

&nbsp;   await savePerformances(performances);

&nbsp;   

&nbsp;   setMessage(`✓ Uploaded ${performances.length} performances from ${bandNames.size} bands`);

&nbsp;   setUploading(false);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('CSV upload error:', error);

&nbsp;   setMessage('⚠️ Error uploading schedule: ' + error.message);

&nbsp;   setUploading(false);

&nbsp; }

};

```



---



\### \*\*Save Band Registry Function:\*\*



```javascript

const saveBandRegistry = async (bandNames) => {

&nbsp; try {

&nbsp;   // Get existing bands from schedule

&nbsp;   const existingBands = await db.bands

&nbsp;     .where('source', '==', 'schedule')

&nbsp;     .toArray();

&nbsp;   

&nbsp;   // Delete old schedule-sourced bands

&nbsp;   for (const band of existingBands) {

&nbsp;     await db.bands.delete(band.id);

&nbsp;   }

&nbsp;   

&nbsp;   // Add new bands from schedule

&nbsp;   for (const bandName of bandNames) {

&nbsp;     await db.bands.add({

&nbsp;       name: bandName,

&nbsp;       name\_normalized: normalizeBandName(bandName),

&nbsp;       created\_at: new Date(),

&nbsp;       source: 'schedule'

&nbsp;     });

&nbsp;   }

&nbsp;   

&nbsp;   console.log(`✓ Band registry updated: ${bandNames.length} bands`);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error saving band registry:', error);

&nbsp;   // Don't throw - band registry failure shouldn't block schedule upload

&nbsp; }

};

```



---



\### \*\*Optional: Auto-create Locations:\*\*



```javascript

const createLocationsFromStages = async (stageNames) => {

&nbsp; try {

&nbsp;   const existingLocations = await db.locations.toArray();

&nbsp;   const existingNames = new Set(

&nbsp;     existingLocations.map(loc => loc.name.toLowerCase())

&nbsp;   );

&nbsp;   

&nbsp;   // Predefined colors for stages

&nbsp;   const colors = \[

&nbsp;     '#4caf50', '#2196f3', '#ff9800', '#e91e63', 

&nbsp;     '#9c27b0', '#00bcd4', '#ff5722', '#795548'

&nbsp;   ];

&nbsp;   

&nbsp;   let colorIndex = 0;

&nbsp;   

&nbsp;   for (const stageName of stageNames) {

&nbsp;     // Skip if already exists

&nbsp;     if (existingNames.has(stageName.toLowerCase())) continue;

&nbsp;     

&nbsp;     await db.locations.add({

&nbsp;       name: stageName,

&nbsp;       type: 'stage',

&nbsp;       color: colors\[colorIndex % colors.length],

&nbsp;       emoji: '🎤'

&nbsp;     });

&nbsp;     

&nbsp;     colorIndex++;

&nbsp;   }

&nbsp;   

&nbsp;   console.log(`✓ Created ${stageNames.length - existingNames.size} new locations`);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error creating locations:', error);

&nbsp;   // Don't throw - location creation failure shouldn't block schedule upload

&nbsp; }

};

```



---



\## \*\*🎨 GEAR REGISTRATION - AUTOCOMPLETE\*\*



\### \*\*Update RegisterGear.jsx:\*\*



\*\*Load bands from registry:\*\*



```javascript

import { normalizeBandName } from '../utils/bandNormalization';



const \[bandName, setBandName] = useState('');

const \[bandSuggestions, setBandSuggestions] = useState(\[]);

const \[showSuggestions, setShowSuggestions] = useState(false);

const \[registeredBands, setRegisteredBands] = useState(\[]);



useEffect(() => {

&nbsp; loadBands();

}, \[]);



const loadBands = async () => {

&nbsp; try {

&nbsp;   // Try to load from band registry first

&nbsp;   let bands = await db.bands.toArray();

&nbsp;   

&nbsp;   // If no bands in registry, fall back to gear items

&nbsp;   if (bands.length === 0) {

&nbsp;     const gear = await db.gear.toArray();

&nbsp;     const uniqueBands = \[...new Set(gear.map(g => g.band\_id))];

&nbsp;     setRegisteredBands(uniqueBands.sort());

&nbsp;   } else {

&nbsp;     // Sort: schedule bands first, then manual

&nbsp;     bands.sort((a, b) => {

&nbsp;       if (a.source === 'schedule' \&\& b.source !== 'schedule') return -1;

&nbsp;       if (a.source !== 'schedule' \&\& b.source === 'schedule') return 1;

&nbsp;       return a.name.localeCompare(b.name);

&nbsp;     });

&nbsp;     

&nbsp;     setRegisteredBands(bands);

&nbsp;   }

&nbsp; } catch (error) {

&nbsp;   console.error('Error loading bands:', error);

&nbsp; }

};

```



---



\*\*Handle input with autocomplete:\*\*



```javascript

const handleBandNameChange = (value) => {

&nbsp; setBandName(value);

&nbsp; 

&nbsp; if (value.length >= 2) {

&nbsp;   const normalized = normalizeBandName(value);

&nbsp;   

&nbsp;   // Filter bands by normalized name

&nbsp;   const suggestions = registeredBands.filter(band => {

&nbsp;     const bandName = typeof band === 'string' ? band : band.name;

&nbsp;     const bandNormalized = normalizeBandName(bandName);

&nbsp;     return bandNormalized.includes(normalized);

&nbsp;   });

&nbsp;   

&nbsp;   setBandSuggestions(suggestions);

&nbsp;   setShowSuggestions(suggestions.length > 0);

&nbsp; } else {

&nbsp;   setShowSuggestions(false);

&nbsp; }

};



const selectBand = (bandName) => {

&nbsp; const name = typeof bandName === 'string' ? bandName : bandName.name;

&nbsp; setBandName(name);

&nbsp; setShowSuggestions(false);

};

```



---



\*\*Autocomplete dropdown UI:\*\*



```javascript

<div style={{ position: 'relative', marginBottom: '20px' }}>

&nbsp; <label style={styles.label}>Band Name \*</label>

&nbsp; <input

&nbsp;   type="text"

&nbsp;   value={bandName}

&nbsp;   onChange={(e) => handleBandNameChange(e.target.value)}

&nbsp;   onFocus={() => bandSuggestions.length > 0 \&\& setShowSuggestions(true)}

&nbsp;   onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}

&nbsp;   placeholder="Start typing band name..."

&nbsp;   style={styles.input}

&nbsp; />

&nbsp; 

&nbsp; {showSuggestions \&\& bandSuggestions.length > 0 \&\& (

&nbsp;   <div style={styles.suggestionsDropdown}>

&nbsp;     {bandSuggestions.map((band, idx) => {

&nbsp;       const isObject = typeof band === 'object';

&nbsp;       const bandName = isObject ? band.name : band;

&nbsp;       const source = isObject ? band.source : 'manual';

&nbsp;       

&nbsp;       return (

&nbsp;         <div

&nbsp;           key={idx}

&nbsp;           onClick={() => selectBand(band)}

&nbsp;           style={styles.suggestionItem}

&nbsp;         >

&nbsp;           <span>

&nbsp;             {source === 'schedule' ? '📅 ' : '👤 '}

&nbsp;             {bandName}

&nbsp;           </span>

&nbsp;         </div>

&nbsp;       );

&nbsp;     })}

&nbsp;   </div>

&nbsp; )}

</div>

```



\*\*Styles:\*\*



```javascript

suggestionsDropdown: {

&nbsp; position: 'absolute',

&nbsp; top: '100%',

&nbsp; left: 0,

&nbsp; right: 0,

&nbsp; background: '#1a1a1a',

&nbsp; border: '2px solid #ffa500',

&nbsp; borderRadius: '4px',

&nbsp; marginTop: '4px',

&nbsp; maxHeight: '200px',

&nbsp; overflowY: 'auto',

&nbsp; zIndex: 1000,

&nbsp; boxShadow: '0 4px 12px rgba(0,0,0,0.5)'

},



suggestionItem: {

&nbsp; padding: '12px 16px',

&nbsp; cursor: 'pointer',

&nbsp; borderBottom: '1px solid #3a3a3a',

&nbsp; color: '#e0e0e0',

&nbsp; fontSize: '14px',

&nbsp; transition: 'background 0.2s'

}

// Add hover in inline style or separate CSS:

// suggestionItem:hover { background: #2d2d2d; }

```



---



\*\*Save with normalized name:\*\*



```javascript

const handleRegister = async () => {

&nbsp; // ... validation ...

&nbsp; 

&nbsp; try {

&nbsp;   // Add to band registry if new

&nbsp;   const existingBand = await db.bands

&nbsp;     .where('name\_normalized', '==', normalizeBandName(bandName))

&nbsp;     .toArray();

&nbsp;   

&nbsp;   if (existingBand.length === 0) {

&nbsp;     await db.bands.add({

&nbsp;       name: bandName.trim(),

&nbsp;       name\_normalized: normalizeBandName(bandName),

&nbsp;       created\_at: new Date(),

&nbsp;       source: 'manual'

&nbsp;     });

&nbsp;   }

&nbsp;   

&nbsp;   // Register gear with normalized field

&nbsp;   const gearId = await db.gear.add({

&nbsp;     band\_id: bandName.trim(),

&nbsp;     band\_id\_normalized: normalizeBandName(bandName), // 🆕

&nbsp;     description: item.description.trim(),

&nbsp;     qr\_code: '',

&nbsp;     current\_location\_id: item.initialLocation ? parseInt(item.initialLocation) : null,

&nbsp;     status: 'active',

&nbsp;     created\_at: new Date(),

&nbsp;     in\_transit: false,

&nbsp;     checked\_out: false,

&nbsp;     lastUpdated: new Date()

&nbsp;   });

&nbsp;   

&nbsp;   // ... rest of registration ...

&nbsp; } catch (error) {

&nbsp;   console.error('Error registering gear:', error);

&nbsp; }

};

```



---



\## \*\*📋 GEAR LIST - GROUP BY NORMALIZED NAME\*\*



\### \*\*Update GearList.jsx:\*\*



\*\*Import normalization:\*\*



```javascript

import { normalizeBandName } from '../utils/bandNormalization';

```



\*\*Group by normalized band name:\*\*



```javascript

const groupByBand = (items) => {

&nbsp; const grouped = {};

&nbsp; 

&nbsp; items.forEach(item => {

&nbsp;   // Use normalized for grouping key

&nbsp;   const normalized = item.band\_id\_normalized || normalizeBandName(item.band\_id);

&nbsp;   

&nbsp;   if (!grouped\[normalized]) {

&nbsp;     grouped\[normalized] = {

&nbsp;       displayName: item.band\_id, // Use first occurrence for display

&nbsp;       items: \[]

&nbsp;     };

&nbsp;   }

&nbsp;   

&nbsp;   grouped\[normalized].items.push(item);

&nbsp; });

&nbsp; 

&nbsp; return grouped;

};



const filteredItems = getFilteredItems();

const groupedItems = groupByBand(filteredItems);

```



\*\*Render with schedule icon:\*\*



```javascript

{Object.entries(groupedItems).map((\[normalizedKey, group]) => (

&nbsp; <div key={normalizedKey} style={styles.bandGroup}>

&nbsp;   <div style={styles.bandHeader} onClick={() => toggleBand(normalizedKey)}>

&nbsp;     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

&nbsp;       <h3 style={styles.bandName}>{group.displayName}</h3>

&nbsp;       {/\* 🆕 Schedule icon \*/}

&nbsp;       <button

&nbsp;         onClick={(e) => {

&nbsp;           e.stopPropagation();

&nbsp;           handleViewSchedule(group.displayName);

&nbsp;         }}

&nbsp;         style={styles.scheduleIcon}

&nbsp;         title="View performance schedule"

&nbsp;       >

&nbsp;         📅

&nbsp;       </button>

&nbsp;     </div>

&nbsp;     <div style={styles.bandCount}>{group.items.length} Items</div>

&nbsp;   </div>

&nbsp;   

&nbsp;   {expandedBands\[normalizedKey] \&\& (

&nbsp;     <div style={styles.bandItems}>

&nbsp;       {group.items.map(item => (

&nbsp;         // ... render gear items ...

&nbsp;       ))}

&nbsp;     </div>

&nbsp;   )}

&nbsp; </div>

))}

```



\*\*Schedule icon style:\*\*



```javascript

scheduleIcon: {

&nbsp; background: 'transparent',

&nbsp; border: 'none',

&nbsp; fontSize: '18px',

&nbsp; cursor: 'pointer',

&nbsp; padding: '4px',

&nbsp; display: 'flex',

&nbsp; alignItems: 'center',

&nbsp; justifyContent: 'center',

&nbsp; transition: 'transform 0.2s',

&nbsp; minWidth: '0',

&nbsp; minHeight: '0'

}

// Add hover effect inline or CSS: transform: scale(1.2)

```



---



\## \*\*📅 BAND SCHEDULE MODAL\*\*



\*\*Add to GearList.jsx:\*\*



```javascript

const \[viewingSchedule, setViewingSchedule] = useState(null);

const \[schedulePerformances, setSchedulePerformances] = useState(\[]);



const handleViewSchedule = async (bandName) => {

&nbsp; try {

&nbsp;   const normalized = normalizeBandName(bandName);

&nbsp;   

&nbsp;   // Get all performances for this band

&nbsp;   const allPerformances = await db.performances.toArray();

&nbsp;   const bandPerformances = allPerformances.filter(perf => 

&nbsp;     normalizeBandName(perf.band\_id) === normalized

&nbsp;   );

&nbsp;   

&nbsp;   // Sort by date/time

&nbsp;   bandPerformances.sort((a, b) => {

&nbsp;     const dateCompare = a.date.localeCompare(b.date);

&nbsp;     if (dateCompare !== 0) return dateCompare;

&nbsp;     return a.time.localeCompare(b.time);

&nbsp;   });

&nbsp;   

&nbsp;   setViewingSchedule(bandName);

&nbsp;   setSchedulePerformances(bandPerformances);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error loading schedule:', error);

&nbsp; }

};



const closeScheduleModal = () => {

&nbsp; setViewingSchedule(null);

&nbsp; setSchedulePerformances(\[]);

};

```



\*\*Schedule modal UI:\*\*



```javascript

{viewingSchedule \&\& (

&nbsp; <div style={styles.scheduleModalOverlay} onClick={closeScheduleModal}>

&nbsp;   <div style={styles.scheduleModalCard} onClick={(e) => e.stopPropagation()}>

&nbsp;     <div style={styles.scheduleModalHeader}>

&nbsp;       <h3 style={styles.scheduleModalTitle}>

&nbsp;         📅 {viewingSchedule} Schedule

&nbsp;       </h3>

&nbsp;     </div>

&nbsp;     

&nbsp;     <div style={styles.scheduleModalContent}>

&nbsp;       {schedulePerformances.length === 0 ? (

&nbsp;         <div style={styles.emptySchedule}>

&nbsp;           No scheduled performances for this band

&nbsp;         </div>

&nbsp;       ) : (

&nbsp;         schedulePerformances.map((perf, idx) => {

&nbsp;           const location = locations.find(l => l.id === perf.location\_id);

&nbsp;           return (

&nbsp;             <div key={idx} style={styles.schedulePerformanceCard}>

&nbsp;               <div style={styles.schedulePerfDate}>

&nbsp;                 {formatDate(perf.date)}

&nbsp;               </div>

&nbsp;               <div style={styles.schedulePerfDetails}>

&nbsp;                 <div style={styles.schedulePerfLocation}>

&nbsp;                   {location?.name || 'Unknown Location'}

&nbsp;                 </div>

&nbsp;                 <div style={styles.schedulePerfTime}>

&nbsp;                   {formatTime(perf.time)}

&nbsp;                 </div>

&nbsp;               </div>

&nbsp;             </div>

&nbsp;           );

&nbsp;         })

&nbsp;       )}

&nbsp;     </div>

&nbsp;     

&nbsp;     <button onClick={closeScheduleModal} style={styles.scheduleModalClose}>

&nbsp;       Close

&nbsp;     </button>

&nbsp;   </div>

&nbsp; </div>

)}

```



\*\*Modal styles:\*\*



```javascript

scheduleModalOverlay: {

&nbsp; position: 'fixed',

&nbsp; top: 0,

&nbsp; left: 0,

&nbsp; right: 0,

&nbsp; bottom: 0,

&nbsp; background: 'rgba(0, 0, 0, 0.85)',

&nbsp; zIndex: 1500,

&nbsp; display: 'flex',

&nbsp; alignItems: 'center',

&nbsp; justifyContent: 'center',

&nbsp; padding: '20px'

},



scheduleModalCard: {

&nbsp; background: '#2d2d2d',

&nbsp; borderRadius: '12px',

&nbsp; padding: '24px',

&nbsp; maxWidth: '400px',

&nbsp; width: '100%',

&nbsp; maxHeight: '80vh',

&nbsp; overflowY: 'auto',

&nbsp; border: '2px solid #ffa500'

},



scheduleModalHeader: {

&nbsp; marginBottom: '20px',

&nbsp; paddingBottom: '16px',

&nbsp; borderBottom: '2px solid #3a3a3a'

},



scheduleModalTitle: {

&nbsp; margin: 0,

&nbsp; fontSize: '18px',

&nbsp; fontWeight: '700',

&nbsp; color: '#ffa500',

&nbsp; textTransform: 'uppercase',

&nbsp; letterSpacing: '1px'

},



scheduleModalContent: {

&nbsp; marginBottom: '20px'

},



emptySchedule: {

&nbsp; padding: '40px 20px',

&nbsp; textAlign: 'center',

&nbsp; color: '#888',

&nbsp; fontSize: '14px'

},



schedulePerformanceCard: {

&nbsp; padding: '12px',

&nbsp; marginBottom: '12px',

&nbsp; background: '#1a1a1a',

&nbsp; borderRadius: '6px',

&nbsp; border: '1px solid #3a3a3a',

&nbsp; borderLeft: '4px solid #ffa500'

},



schedulePerfDate: {

&nbsp; fontSize: '12px',

&nbsp; color: '#888',

&nbsp; marginBottom: '8px',

&nbsp; textTransform: 'uppercase',

&nbsp; letterSpacing: '0.5px',

&nbsp; fontWeight: '600'

},



schedulePerfDetails: {

&nbsp; display: 'flex',

&nbsp; justifyContent: 'space-between',

&nbsp; alignItems: 'center'

},



schedulePerfLocation: {

&nbsp; fontSize: '15px',

&nbsp; color: '#ffa500',

&nbsp; fontWeight: '600'

},



schedulePerfTime: {

&nbsp; fontSize: '14px',

&nbsp; color: '#ccc',

&nbsp; fontWeight: '600'

},



scheduleModalClose: {

&nbsp; width: '100%',

&nbsp; padding: '14px',

&nbsp; background: '#2d2d2d',

&nbsp; color: '#ffa500',

&nbsp; border: '2px solid #ffa500',

&nbsp; borderRadius: '6px',

&nbsp; fontSize: '14px',

&nbsp; fontWeight: '700',

&nbsp; cursor: 'pointer',

&nbsp; textTransform: 'uppercase',

&nbsp; letterSpacing: '1px'

}

```



\*\*Helper functions:\*\*



```javascript

const formatDate = (dateString) => {

&nbsp; const date = new Date(dateString);

&nbsp; return date.toLocaleDateString('en-US', { 

&nbsp;   weekday: 'short', 

&nbsp;   month: 'short', 

&nbsp;   day: 'numeric' 

&nbsp; });

};



const formatTime = (timeString) => {

&nbsp; if (!timeString) return '';

&nbsp; const \[hours, minutes] = timeString.split(':');

&nbsp; const hour = parseInt(hours);

&nbsp; const ampm = hour >= 12 ? 'PM' : 'AM';

&nbsp; const hour12 = hour % 12 || 12;

&nbsp; return `${hour12}:${minutes} ${ampm}`;

};

```



---



\## \*\*✅ TESTING CHECKLIST - BAND REGISTRY\*\*



\- \[ ] Schedule upload extracts bands correctly

\- \[ ] Band registry created with normalized names

\- \[ ] Autocomplete shows schedule bands first

\- \[ ] Autocomplete filters by normalized name

\- \[ ] Can select from autocomplete

\- \[ ] Can create new manual band

\- \[ ] Manual band added to registry

\- \[ ] Gear List groups by normalized name

\- \[ ] "The Script" and "Script" group together

\- \[ ] Schedule icon appears next to band name

\- \[ ] Click schedule icon shows performances

\- \[ ] Modal displays correct performances

\- \[ ] Modal sorted by date/time

\- \[ ] Empty state if no performances

\- \[ ] Close modal works

\- \[ ] Re-uploading schedule updates registry

\- \[ ] Manual bands preserved on re-upload



---



\# \*\*FEATURE 2: BULK USER UPLOAD\*\*



\## \*\*🎯 OVERVIEW\*\*



Allow Owner/Admin to upload CSV of team members, automatically generating invitation codes for each user.



---



\## \*\*🗄️ DATABASE STRUCTURE\*\*



\### \*\*Existing Collection (already implemented): `festivals/{festivalId}/invitations`\*\*



```javascript

{

&nbsp; id: "inv\_abc123",

&nbsp; code: "FEST-A1-B2-C3",

&nbsp; email: "john@crew.com",

&nbsp; name: "John Smith",

&nbsp; role: "admin" | "user",

&nbsp; created\_by: "owner\_uid",

&nbsp; created\_at: timestamp,

&nbsp; expires\_at: timestamp,

&nbsp; status: "pending" | "used" | "revoked",

&nbsp; used\_at: timestamp | null,

&nbsp; used\_by: "user\_uid" | null

}

```



---



\## \*\*📤 CSV FORMAT\*\*



\*\*Required format:\*\*



```csv

Name, Email, Role

John Smith, john@crew.com, admin

Sarah Connor, sarah@crew.com, user

Mike Johnson, mike@crew.com, admin

Tom Wilson, tom@crew.com, user

```



\*\*Validation rules:\*\*

\- Name: Required, 1-100 characters

\- Email: Required, valid format, unique

\- Role: Required, must be "admin" or "user" (case-insensitive)



---



\## \*\*🔧 IMPLEMENTATION\*\*



\### \*\*Create: `/src/components/UserManagement.jsx`\*\*



```javascript

import { useState, useEffect } from 'react';

import { useDatabase } from '../contexts/DatabaseContext';

import { useAuth } from '../contexts/AuthContext';



export default function UserManagement() {

&nbsp; const db = useDatabase();

&nbsp; const { currentUser } = useAuth();

&nbsp; 

&nbsp; const \[invitations, setInvitations] = useState(\[]);

&nbsp; const \[activeUsers, setActiveUsers] = useState(\[]);

&nbsp; const \[showSingleInvite, setShowSingleInvite] = useState(false);

&nbsp; const \[showBulkUpload, setShowBulkUpload] = useState(false);

&nbsp; const \[message, setMessage] = useState('');

&nbsp; const \[loading, setLoading] = useState(true);



&nbsp; useEffect(() => {

&nbsp;   loadData();

&nbsp; }, \[]);



&nbsp; const loadData = async () => {

&nbsp;   try {

&nbsp;     setLoading(true);

&nbsp;     

&nbsp;     // Load invitations

&nbsp;     const invs = await db.invitations.toArray();

&nbsp;     setInvitations(invs.filter(inv => inv.status !== 'used'));

&nbsp;     

&nbsp;     // Load active users

&nbsp;     const users = await db.users.toArray();

&nbsp;     setActiveUsers(users);

&nbsp;     

&nbsp;     setLoading(false);

&nbsp;   } catch (error) {

&nbsp;     console.error('Error loading data:', error);

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; };



&nbsp; return (

&nbsp;   <div>

&nbsp;     <div style={styles.pageTitle}>

&nbsp;       👥 User Management

&nbsp;     </div>



&nbsp;     {message \&\& (

&nbsp;       <div style={styles.message}>

&nbsp;         {message}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     <div style={styles.actionButtons}>

&nbsp;       <button 

&nbsp;         onClick={() => setShowSingleInvite(true)}

&nbsp;         style={styles.actionBtn}

&nbsp;       >

&nbsp;         + Invite Single User

&nbsp;       </button>

&nbsp;       <button 

&nbsp;         onClick={() => setShowBulkUpload(true)}

&nbsp;         style={styles.actionBtnSecondary}

&nbsp;       >

&nbsp;         📤 Bulk Upload Users

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     {loading ? (

&nbsp;       <div style={styles.loading}>Loading...</div>

&nbsp;     ) : (

&nbsp;       <>

&nbsp;         <InvitationsList 

&nbsp;           invitations={invitations} 

&nbsp;           onUpdate={loadData}

&nbsp;         />

&nbsp;         

&nbsp;         <ActiveUsersList 

&nbsp;           users={activeUsers}

&nbsp;           onUpdate={loadData}

&nbsp;         />

&nbsp;       </>

&nbsp;     )}



&nbsp;     {showBulkUpload \&\& (

&nbsp;       <BulkUploadModal 

&nbsp;         onClose={() => setShowBulkUpload(false)}

&nbsp;         onSuccess={loadData}

&nbsp;       />

&nbsp;     )}



&nbsp;     {showSingleInvite \&\& (

&nbsp;       <SingleInviteModal 

&nbsp;         onClose={() => setShowSingleInvite(false)}

&nbsp;         onSuccess={loadData}

&nbsp;       />

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}

```



---



\### \*\*Bulk Upload Modal Component:\*\*



```javascript

function BulkUploadModal({ onClose, onSuccess }) {

&nbsp; const db = useDatabase();

&nbsp; const { currentUser } = useAuth();

&nbsp; 

&nbsp; const \[file, setFile] = useState(null);

&nbsp; const \[parsedUsers, setParsedUsers] = useState(\[]);

&nbsp; const \[showPreview, setShowPreview] = useState(false);

&nbsp; const \[error, setError] = useState('');

&nbsp; const \[uploading, setUploading] = useState(false);



&nbsp; const handleFileSelect = (e) => {

&nbsp;   const selectedFile = e.target.files\[0];

&nbsp;   if (selectedFile \&\& selectedFile.type === 'text/csv') {

&nbsp;     setFile(selectedFile);

&nbsp;     setError('');

&nbsp;   } else {

&nbsp;     setError('Please select a valid CSV file');

&nbsp;   }

&nbsp; };



&nbsp; const parseCSV = async () => {

&nbsp;   if (!file) return;

&nbsp;   

&nbsp;   try {

&nbsp;     const text = await file.text();

&nbsp;     const lines = text.split('\\n').filter(line => line.trim());

&nbsp;     

&nbsp;     if (lines.length === 0) {

&nbsp;       setError('CSV file is empty');

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     // Check for header

&nbsp;     const firstLine = lines\[0].toLowerCase();

&nbsp;     const hasHeader = firstLine.includes('name') || firstLine.includes('email');

&nbsp;     const dataLines = hasHeader ? lines.slice(1) : lines;

&nbsp;     

&nbsp;     const users = \[];

&nbsp;     const errors = \[];

&nbsp;     const seenEmails = new Set();

&nbsp;     

&nbsp;     dataLines.forEach((line, index) => {

&nbsp;       const rowNum = hasHeader ? index + 2 : index + 1;

&nbsp;       

&nbsp;       if (!line.trim()) return;

&nbsp;       

&nbsp;       const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

&nbsp;       

&nbsp;       if (parts.length < 3) {

&nbsp;         errors.push(`Row ${rowNum}: Expected 3 columns (Name, Email, Role)`);

&nbsp;         return;

&nbsp;       }

&nbsp;       

&nbsp;       const \[name, email, role] = parts;

&nbsp;       

&nbsp;       // Validate name

&nbsp;       if (!name || name.length === 0) {

&nbsp;         errors.push(`Row ${rowNum}: Name is required`);

&nbsp;         return;

&nbsp;       }

&nbsp;       

&nbsp;       if (name.length > 100) {

&nbsp;         errors.push(`Row ${rowNum}: Name too long (max 100 characters)`);

&nbsp;         return;

&nbsp;       }

&nbsp;       

&nbsp;       // Validate email

&nbsp;       const emailRegex = /^\[^\\s@]+@\[^\\s@]+\\.\[^\\s@]+$/;

&nbsp;       if (!emailRegex.test(email)) {

&nbsp;         errors.push(`Row ${rowNum}: Invalid email "${email}"`);

&nbsp;         return;

&nbsp;       }

&nbsp;       

&nbsp;       // Check duplicate

&nbsp;       if (seenEmails.has(email.toLowerCase())) {

&nbsp;         errors.push(`Row ${rowNum}: Duplicate email "${email}"`);

&nbsp;         return;

&nbsp;       }

&nbsp;       seenEmails.add(email.toLowerCase());

&nbsp;       

&nbsp;       // Validate role

&nbsp;       const normalizedRole = role.toLowerCase();

&nbsp;       if (normalizedRole !== 'admin' \&\& normalizedRole !== 'user') {

&nbsp;         errors.push(`Row ${rowNum}: Role must be "admin" or "user", got "${role}"`);

&nbsp;         return;

&nbsp;       }

&nbsp;       

&nbsp;       users.push({

&nbsp;         name: name.trim(),

&nbsp;         email: email.toLowerCase().trim(),

&nbsp;         role: normalizedRole

&nbsp;       });

&nbsp;     });

&nbsp;     

&nbsp;     if (errors.length > 0) {

&nbsp;       setError(`Validation errors:\\n${errors.join('\\n')}`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     if (users.length === 0) {

&nbsp;       setError('No valid users found in CSV');

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     setParsedUsers(users);

&nbsp;     setShowPreview(true);

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     console.error('CSV parse error:', error);

&nbsp;     setError('Error parsing CSV: ' + error.message);

&nbsp;   }

&nbsp; };



&nbsp; const createInvitations = async () => {

&nbsp;   try {

&nbsp;     setUploading(true);

&nbsp;     const invitations = \[];

&nbsp;     

&nbsp;     for (const user of parsedUsers) {

&nbsp;       const code = generateInvitationCode();

&nbsp;       

&nbsp;       await db.invitations.add({

&nbsp;         code: code,

&nbsp;         email: user.email,

&nbsp;         name: user.name,

&nbsp;         role: user.role,

&nbsp;         created\_by: currentUser.uid,

&nbsp;         created\_at: new Date(),

&nbsp;         expires\_at: new Date(Date.now() + 7 \* 24 \* 60 \* 60 \* 1000),

&nbsp;         status: 'pending',

&nbsp;         used\_at: null,

&nbsp;         used\_by: null

&nbsp;       });

&nbsp;       

&nbsp;       invitations.push({

&nbsp;         ...user,

&nbsp;         code: code

&nbsp;       });

&nbsp;     }

&nbsp;     

&nbsp;     // Export CSV for download

&nbsp;     exportInvitationsCSV(invitations);

&nbsp;     

&nbsp;     setUploading(false);

&nbsp;     onSuccess();

&nbsp;     onClose();

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     console.error('Error creating invitations:', error);

&nbsp;     setError('Failed to create invitations: ' + error.message);

&nbsp;     setUploading(false);

&nbsp;   }

&nbsp; };



&nbsp; const generateInvitationCode = () => {

&nbsp;   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

&nbsp;   const segments = 3;

&nbsp;   const segmentLength = 2;

&nbsp;   

&nbsp;   const code = Array.from({ length: segments }, () => {

&nbsp;     return Array.from({ length: segmentLength }, () => 

&nbsp;       chars\[Math.floor(Math.random() \* chars.length)]

&nbsp;     ).join('');

&nbsp;   }).join('-');

&nbsp;   

&nbsp;   return `FEST-${code}`;

&nbsp; };



&nbsp; const exportInvitationsCSV = (invitations) => {

&nbsp;   const header = 'Name,Email,Role,Invitation Code\\n';

&nbsp;   const rows = invitations.map(inv => 

&nbsp;     `${inv.name},${inv.email},${inv.role},${inv.code}`

&nbsp;   ).join('\\n');

&nbsp;   

&nbsp;   const csv = header + rows;

&nbsp;   

&nbsp;   const blob = new Blob(\[csv], { type: 'text/csv' });

&nbsp;   const url = URL.createObjectURL(blob);

&nbsp;   const a = document.createElement('a');

&nbsp;   a.href = url;

&nbsp;   a.download = `invitations\_${new Date().toISOString().split('T')\[0]}.csv`;

&nbsp;   a.click();

&nbsp;   URL.revokeObjectURL(url);

&nbsp; };



&nbsp; return (

&nbsp;   <div style={styles.modalOverlay} onClick={onClose}>

&nbsp;     <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>

&nbsp;       <div style={styles.modalHeader}>

&nbsp;         <h3 style={styles.modalTitle}>

&nbsp;           {showPreview ? 'Preview Users' : 'Bulk Upload Users'}

&nbsp;         </h3>

&nbsp;       </div>



&nbsp;       {error \&\& (

&nbsp;         <div style={styles.errorBox}>

&nbsp;           {error}

&nbsp;         </div>

&nbsp;       )}



&nbsp;       {!showPreview ? (

&nbsp;         <div>

&nbsp;           <div style={styles.formatInfo}>

&nbsp;             <div style={styles.formatTitle}>CSV Format:</div>

&nbsp;             <div style={styles.formatExample}>

&nbsp;               Name, Email, Role<br/>

&nbsp;               John Smith, john@crew.com, admin<br/>

&nbsp;               Sarah Connor, sarah@crew.com, user

&nbsp;             </div>

&nbsp;             <div style={styles.formatNote}>

&nbsp;               Roles: <strong>admin</strong> or <strong>user</strong>

&nbsp;             </div>

&nbsp;           </div>



&nbsp;           <div style={styles.fileInput}>

&nbsp;             <input

&nbsp;               type="file"

&nbsp;               accept=".csv"

&nbsp;               onChange={handleFileSelect}

&nbsp;               style={styles.fileInputElement}

&nbsp;             />

&nbsp;             {file \&\& (

&nbsp;               <div style={styles.fileSelected}>

&nbsp;                 ✓ {file.name}

&nbsp;               </div>

&nbsp;             )}

&nbsp;           </div>



&nbsp;           <div style={styles.modalButtons}>

&nbsp;             <button

&nbsp;               onClick={parseCSV}

&nbsp;               disabled={!file}

&nbsp;               style={{

&nbsp;                 ...styles.modalBtnPrimary,

&nbsp;                 opacity: file ? 1 : 0.5,

&nbsp;                 cursor: file ? 'pointer' : 'not-allowed'

&nbsp;               }}

&nbsp;             >

&nbsp;               Preview \& Upload

&nbsp;             </button>

&nbsp;             <button onClick={onClose} style={styles.modalBtnSecondary}>

&nbsp;               Cancel

&nbsp;             </button>

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       ) : (

&nbsp;         <div>

&nbsp;           <div style={styles.previewSummary}>

&nbsp;             {parsedUsers.length} users ready to invite:

&nbsp;           </div>



&nbsp;           <div style={styles.previewGroups}>

&nbsp;             {parsedUsers.filter(u => u.role === 'admin').length > 0 \&\& (

&nbsp;               <div style={styles.previewGroup}>

&nbsp;                 <div style={styles.previewGroupTitle}>

&nbsp;                   Admins ({parsedUsers.filter(u => u.role === 'admin').length}):

&nbsp;                 </div>

&nbsp;                 {parsedUsers.filter(u => u.role === 'admin').map((user, idx) => (

&nbsp;                   <div key={idx} style={styles.previewUser}>

&nbsp;                     • {user.name} ({user.email})

&nbsp;                   </div>

&nbsp;                 ))}

&nbsp;               </div>

&nbsp;             )}



&nbsp;             {parsedUsers.filter(u => u.role === 'user').length > 0 \&\& (

&nbsp;               <div style={styles.previewGroup}>

&nbsp;                 <div style={styles.previewGroupTitle}>

&nbsp;                   Users ({parsedUsers.filter(u => u.role === 'user').length}):

&nbsp;                 </div>

&nbsp;                 {parsedUsers.filter(u => u.role === 'user').map((user, idx) => (

&nbsp;                   <div key={idx} style={styles.previewUser}>

&nbsp;                     • {user.name} ({user.email})

&nbsp;                   </div>

&nbsp;                 ))}

&nbsp;               </div>

&nbsp;             )}

&nbsp;           </div>



&nbsp;           <div style={styles.previewNote}>

&nbsp;             ⚠️ Invitation codes will be generated and downloaded as CSV

&nbsp;           </div>



&nbsp;           <div style={styles.modalButtons}>

&nbsp;             <button

&nbsp;               onClick={createInvitations}

&nbsp;               disabled={uploading}

&nbsp;               style={{

&nbsp;                 ...styles.modalBtnPrimary,

&nbsp;                 opacity: uploading ? 0.5 : 1,

&nbsp;                 cursor: uploading ? 'not-allowed' : 'pointer'

&nbsp;               }}

&nbsp;             >

&nbsp;               {uploading ? 'Creating...' : 'Confirm \& Create Invitations'}

&nbsp;             </button>

&nbsp;             <button 

&nbsp;               onClick={() => setShowPreview(false)} 

&nbsp;               style={styles.modalBtnSecondary}

&nbsp;               disabled={uploading}

&nbsp;             >

&nbsp;               Back

&nbsp;             </button>

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       )}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}

```



---



\### \*\*Styles for UserManagement:\*\*



```javascript

const styles = {

&nbsp; pageTitle: {

&nbsp;   fontSize: '16px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   marginBottom: '20px',

&nbsp;   textAlign: 'center'

&nbsp; },

&nbsp; 

&nbsp; message: {

&nbsp;   padding: '15px',

&nbsp;   marginBottom: '20px',

&nbsp;   background: 'rgba(76, 175, 80, 0.2)',

&nbsp;   color: '#4caf50',

&nbsp;   borderRadius: '6px',

&nbsp;   border: '2px solid #4caf50',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '600'

&nbsp; },

&nbsp; 

&nbsp; actionButtons: {

&nbsp;   display: 'flex',

&nbsp;   gap: '10px',

&nbsp;   marginBottom: '30px',

&nbsp;   flexWrap: 'wrap'

&nbsp; },

&nbsp; 

&nbsp; actionBtn: {

&nbsp;   flex: 1,

&nbsp;   minWidth: '150px',

&nbsp;   padding: '14px 20px',

&nbsp;   background: '#ffa500',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; actionBtnSecondary: {

&nbsp;   flex: 1,

&nbsp;   minWidth: '150px',

&nbsp;   padding: '14px 20px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ffa500',

&nbsp;   border: '2px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; loading: {

&nbsp;   padding: '40px',

&nbsp;   textAlign: 'center',

&nbsp;   color: '#888',

&nbsp;   fontSize: '14px'

&nbsp; },

&nbsp; 

&nbsp; modalOverlay: {

&nbsp;   position: 'fixed',

&nbsp;   top: 0,

&nbsp;   left: 0,

&nbsp;   right: 0,

&nbsp;   bottom: 0,

&nbsp;   background: 'rgba(0, 0, 0, 0.85)',

&nbsp;   zIndex: 2000,

&nbsp;   display: 'flex',

&nbsp;   alignItems: 'center',

&nbsp;   justifyContent: 'center',

&nbsp;   padding: '20px'

&nbsp; },

&nbsp; 

&nbsp; modalCard: {

&nbsp;   background: '#2d2d2d',

&nbsp;   borderRadius: '12px',

&nbsp;   padding: '24px',

&nbsp;   maxWidth: '500px',

&nbsp;   width: '100%',

&nbsp;   maxHeight: '80vh',

&nbsp;   overflowY: 'auto',

&nbsp;   border: '2px solid #ffa500'

&nbsp; },

&nbsp; 

&nbsp; modalHeader: {

&nbsp;   marginBottom: '20px',

&nbsp;   paddingBottom: '16px',

&nbsp;   borderBottom: '2px solid #3a3a3a'

&nbsp; },

&nbsp; 

&nbsp; modalTitle: {

&nbsp;   margin: 0,

&nbsp;   fontSize: '18px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ffa500',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; errorBox: {

&nbsp;   padding: '12px',

&nbsp;   marginBottom: '20px',

&nbsp;   background: 'rgba(244, 67, 54, 0.2)',

&nbsp;   color: '#ff6b6b',

&nbsp;   borderRadius: '6px',

&nbsp;   border: '2px solid #f44336',

&nbsp;   fontSize: '13px',

&nbsp;   whiteSpace: 'pre-wrap'

&nbsp; },

&nbsp; 

&nbsp; formatInfo: {

&nbsp;   padding: '16px',

&nbsp;   background: '#1a1a1a',

&nbsp;   borderRadius: '6px',

&nbsp;   marginBottom: '20px',

&nbsp;   border: '1px solid #3a3a3a'

&nbsp; },

&nbsp; 

&nbsp; formatTitle: {

&nbsp;   fontSize: '13px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ffa500',

&nbsp;   marginBottom: '8px',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; formatExample: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#ccc',

&nbsp;   fontFamily: 'monospace',

&nbsp;   lineHeight: '1.6',

&nbsp;   marginBottom: '8px'

&nbsp; },

&nbsp; 

&nbsp; formatNote: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888'

&nbsp; },

&nbsp; 

&nbsp; fileInput: {

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; fileInputElement: {

&nbsp;   width: '100%',

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '6px',

&nbsp;   border: '2px dashed #ffa500',

&nbsp;   backgroundColor: '#1a1a1a',

&nbsp;   color: '#e0e0e0',

&nbsp;   cursor: 'pointer'

&nbsp; },

&nbsp; 

&nbsp; fileSelected: {

&nbsp;   marginTop: '10px',

&nbsp;   padding: '10px',

&nbsp;   background: 'rgba(76, 175, 80, 0.2)',

&nbsp;   color: '#4caf50',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '13px',

&nbsp;   fontWeight: '600'

&nbsp; },

&nbsp; 

&nbsp; modalButtons: {

&nbsp;   display: 'flex',

&nbsp;   flexDirection: 'column',

&nbsp;   gap: '10px'

&nbsp; },

&nbsp; 

&nbsp; modalBtnPrimary: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#ffa500',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; modalBtnSecondary: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ffa500',

&nbsp;   border: '2px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; previewSummary: {

&nbsp;   fontSize: '15px',

&nbsp;   color: '#e0e0e0',

&nbsp;   marginBottom: '20px',

&nbsp;   fontWeight: '600'

&nbsp; },

&nbsp; 

&nbsp; previewGroups: {

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; previewGroup: {

&nbsp;   marginBottom: '16px'

&nbsp; },

&nbsp; 

&nbsp; previewGroupTitle: {

&nbsp;   fontSize: '13px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '700',

&nbsp;   marginBottom: '8px',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; previewUser: {

&nbsp;   fontSize: '13px',

&nbsp;   color: '#ccc',

&nbsp;   marginBottom: '4px',

&nbsp;   paddingLeft: '8px'

&nbsp; },

&nbsp; 

&nbsp; previewNote: {

&nbsp;   padding: '12px',

&nbsp;   background: 'rgba(255, 165, 0, 0.15)',

&nbsp;   border: '1px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '12px',

&nbsp;   color: '#ffa500',

&nbsp;   marginBottom: '20px'

&nbsp; }

};

```



---



\## \*\*🏠 ADD TO APP.JSX\*\*



\*\*Add User Management button (Owner/Admin only):\*\*



```javascript

{(isOwner || isAdmin) \&\& (

&nbsp; <div style={styles.homeButton} onClick={() => setActiveTab('users')}>

&nbsp;   <span style={styles.homeButtonIcon}>👥</span>

&nbsp;   <div style={styles.homeButtonText}>Users</div>

&nbsp;   <div style={styles.homeButtonDesc}>Manage Team</div>

&nbsp; </div>

)}



// Add route

{activeTab === 'users' \&\& (

&nbsp; <div>

&nbsp;   <UserManagement />

&nbsp;   <button

&nbsp;     onClick={() => setActiveTab('home')}

&nbsp;     style={styles.backButton}

&nbsp;   >

&nbsp;     Back to Home

&nbsp;   </button>

&nbsp; </div>

)}

```



---



\## \*\*✅ TESTING CHECKLIST - BULK UPLOAD\*\*



\- \[ ] CSV file selector works

\- \[ ] Valid CSV parses correctly

\- \[ ] Validation catches errors (invalid email, missing fields, etc.)

\- \[ ] Preview shows correct user counts

\- \[ ] Preview groups by role

\- \[ ] Create invitations generates unique codes

\- \[ ] CSV downloads automatically with codes

\- \[ ] Invitations appear in User Management

\- \[ ] Can handle 50+ users

\- \[ ] Duplicate emails rejected

\- \[ ] Invalid roles rejected

\- \[ ] Empty CSV handled gracefully



---



\# \*\*FEATURE 3: PERSONAL REMINDERS\*\*



\## \*\*🎯 OVERVIEW\*\*



Allow users to set personal reminders for gear-related tasks. No modal popups - reminders appear as badge notifications on home page.



---



\## \*\*🗄️ DATABASE STRUCTURE\*\*



\### \*\*New Collection: `festivals/{festivalId}/reminders`\*\*



```javascript

{

&nbsp; id: "reminder\_abc123",

&nbsp; user\_id: "user\_xyz789",

&nbsp; user\_email: "john@festival.com",

&nbsp; 

&nbsp; // What

&nbsp; gear\_id: "gear\_123" | null,

&nbsp; task: "Move to Salty Dog Stage",

&nbsp; 

&nbsp; // When

&nbsp; remind\_at: timestamp,

&nbsp; created\_at: timestamp,

&nbsp; 

&nbsp; // Status

&nbsp; status: "pending" | "completed" | "dismissed",

&nbsp; completed\_at: timestamp | null,

&nbsp; snoozed\_until: timestamp | null,

&nbsp; 

&nbsp; // Context (for display)

&nbsp; band\_name: "The Script" | null,

&nbsp; item\_description: "Guitar" | null,

&nbsp; current\_location: "Trailer Park" | null,

&nbsp; performance\_time: "20:00" | null,

&nbsp; performance\_location: "Salty Dog Stage" | null

}

```



\### \*\*Update firestoreDb.js:\*\*



```javascript

reminders: {

&nbsp; async add(data) {

&nbsp;   const docRef = await addDoc(collection(db, `festivals/${festivalId}/reminders`), data);

&nbsp;   return docRef.id;

&nbsp; },

&nbsp; 

&nbsp; async toArray() {

&nbsp;   const snapshot = await getDocs(collection(db, `festivals/${festivalId}/reminders`));

&nbsp;   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

&nbsp; },

&nbsp; 

&nbsp; async update(id, data) {

&nbsp;   await updateDoc(doc(db, `festivals/${festivalId}/reminders`, String(id)), data);

&nbsp; },

&nbsp; 

&nbsp; async delete(id) {

&nbsp;   await deleteDoc(doc(db, `festivals/${festivalId}/reminders`, String(id)));

&nbsp; },

&nbsp; 

&nbsp; where(field, operator, value) {

&nbsp;   return {

&nbsp;     async toArray() {

&nbsp;       const q = query(

&nbsp;         collection(db, `festivals/${festivalId}/reminders`),

&nbsp;         fbWhere(field, operator === 'equals' ? '==' : operator, value)

&nbsp;       );

&nbsp;       const snapshot = await getDocs(q);

&nbsp;       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

&nbsp;     }

&nbsp;   };

&nbsp; }

}

```



---



\## \*\*🔧 IMPLEMENTATION\*\*



\### \*\*Create: `/src/components/Reminders.jsx`\*\*



```javascript

import { useState, useEffect } from 'react';

import { useDatabase } from '../contexts/DatabaseContext';

import { useAuth } from '../contexts/AuthContext';



export default function Reminders() {

&nbsp; const db = useDatabase();

&nbsp; const { currentUser } = useAuth();

&nbsp; 

&nbsp; const \[reminders, setReminders] = useState(\[]);

&nbsp; const \[showSetModal, setShowSetModal] = useState(false);

&nbsp; const \[message, setMessage] = useState('');

&nbsp; const \[loading, setLoading] = useState(true);



&nbsp; useEffect(() => {

&nbsp;   loadReminders();

&nbsp; }, \[]);



&nbsp; const loadReminders = async () => {

&nbsp;   try {

&nbsp;     setLoading(true);

&nbsp;     

&nbsp;     const allReminders = await db.reminders

&nbsp;       .where('user\_id', '==', currentUser.uid)

&nbsp;       .toArray();

&nbsp;     

&nbsp;     // Sort: pending first (by remind\_at), then completed

&nbsp;     allReminders.sort((a, b) => {

&nbsp;       if (a.status === 'pending' \&\& b.status !== 'pending') return -1;

&nbsp;       if (a.status !== 'pending' \&\& b.status === 'pending') return 1;

&nbsp;       

&nbsp;       const timeA = a.remind\_at.toDate ? a.remind\_at.toDate() : new Date(a.remind\_at);

&nbsp;       const timeB = b.remind\_at.toDate ? b.remind\_at.toDate() : new Date(b.remind\_at);

&nbsp;       

&nbsp;       return timeA - timeB;

&nbsp;     });

&nbsp;     

&nbsp;     setReminders(allReminders);

&nbsp;     setLoading(false);

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     console.error('Error loading reminders:', error);

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; };



&nbsp; const handleComplete = async (reminderId) => {

&nbsp;   try {

&nbsp;     await db.reminders.update(reminderId, {

&nbsp;       status: 'completed',

&nbsp;       completed\_at: new Date()

&nbsp;     });

&nbsp;     

&nbsp;     setMessage('✓ Reminder marked complete');

&nbsp;     setTimeout(() => setMessage(''), 3000);

&nbsp;     

&nbsp;     loadReminders();

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     console.error('Error completing reminder:', error);

&nbsp;     alert('Failed to complete reminder');

&nbsp;   }

&nbsp; };



&nbsp; const handleSnooze = async (reminderId, minutes) => {

&nbsp;   try {

&nbsp;     const snoozeUntil = new Date(Date.now() + minutes \* 60 \* 1000);

&nbsp;     

&nbsp;     await db.reminders.update(reminderId, {

&nbsp;       snoozed\_until: snoozeUntil

&nbsp;     });

&nbsp;     

&nbsp;     setMessage(`✓ Reminder snoozed for ${minutes} minutes`);

&nbsp;     setTimeout(() => setMessage(''), 3000);

&nbsp;     

&nbsp;     loadReminders();

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     console.error('Error snoozing reminder:', error);

&nbsp;     alert('Failed to snooze reminder');

&nbsp;   }

&nbsp; };



&nbsp; const handleDelete = async (reminderId) => {

&nbsp;   const confirmed = window.confirm('Delete this reminder?');

&nbsp;   if (!confirmed) return;

&nbsp;   

&nbsp;   try {

&nbsp;     await db.reminders.delete(reminderId);

&nbsp;     

&nbsp;     setMessage('✓ Reminder deleted');

&nbsp;     setTimeout(() => setMessage(''), 3000);

&nbsp;     

&nbsp;     loadReminders();

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     console.error('Error deleting reminder:', error);

&nbsp;     alert('Failed to delete reminder');

&nbsp;   }

&nbsp; };



&nbsp; const isDue = (reminder) => {

&nbsp;   if (reminder.status !== 'pending') return false;

&nbsp;   

&nbsp;   const now = new Date();

&nbsp;   const remindTime = reminder.remind\_at.toDate 

&nbsp;     ? reminder.remind\_at.toDate() 

&nbsp;     : new Date(reminder.remind\_at);

&nbsp;   

&nbsp;   // Check if snoozed

&nbsp;   if (reminder.snoozed\_until) {

&nbsp;     const snoozeTime = reminder.snoozed\_until.toDate 

&nbsp;       ? reminder.snoozed\_until.toDate() 

&nbsp;       : new Date(reminder.snoozed\_until);

&nbsp;     return snoozeTime <= now;

&nbsp;   }

&nbsp;   

&nbsp;   return remindTime <= now;

&nbsp; };



&nbsp; const formatDateTime = (timestamp) => {

&nbsp;   const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

&nbsp;   const now = new Date();

&nbsp;   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

&nbsp;   const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

&nbsp;   

&nbsp;   let dateStr;

&nbsp;   if (reminderDate.getTime() === today.getTime()) {

&nbsp;     dateStr = 'Today';

&nbsp;   } else if (reminderDate.getTime() === today.getTime() + 86400000) {

&nbsp;     dateStr = 'Tomorrow';

&nbsp;   } else if (reminderDate.getTime() === today.getTime() - 86400000) {

&nbsp;     dateStr = 'Yesterday';

&nbsp;   } else {

&nbsp;     dateStr = date.toLocaleDateString('en-US', { 

&nbsp;       month: 'short', 

&nbsp;       day: 'numeric' 

&nbsp;     });

&nbsp;   }

&nbsp;   

&nbsp;   const timeStr = date.toLocaleTimeString('en-US', {

&nbsp;     hour: 'numeric',

&nbsp;     minute: '2-digit',

&nbsp;     hour12: true

&nbsp;   });

&nbsp;   

&nbsp;   return `${dateStr} ${timeStr}`;

&nbsp; };



&nbsp; const pendingReminders = reminders.filter(r => r.status === 'pending');

&nbsp; const dueReminders = pendingReminders.filter(isDue);

&nbsp; const upcomingReminders = pendingReminders.filter(r => !isDue(r));

&nbsp; const completedReminders = reminders.filter(r => r.status === 'completed');



&nbsp; if (loading) {

&nbsp;   return <div style={styles.loading}>Loading reminders...</div>;

&nbsp; }



&nbsp; return (

&nbsp;   <div>

&nbsp;     <div style={styles.pageTitle}>

&nbsp;       ⏰ My Reminders

&nbsp;     </div>



&nbsp;     {message \&\& (

&nbsp;       <div style={styles.message}>

&nbsp;         {message}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     <button onClick={() => setShowSetModal(true)} style={styles.addBtn}>

&nbsp;       + New Reminder

&nbsp;     </button>



&nbsp;     {dueReminders.length > 0 \&\& (

&nbsp;       <div>

&nbsp;         <div style={styles.sectionTitle}>

&nbsp;           🔴 DUE NOW ({dueReminders.length})

&nbsp;         </div>

&nbsp;         {dueReminders.map(reminder => (

&nbsp;           <ReminderCard

&nbsp;             key={reminder.id}

&nbsp;             reminder={reminder}

&nbsp;             isDue={true}

&nbsp;             onComplete={handleComplete}

&nbsp;             onSnooze={handleSnooze}

&nbsp;             onDelete={handleDelete}

&nbsp;             formatDateTime={formatDateTime}

&nbsp;           />

&nbsp;         ))}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {upcomingReminders.length > 0 \&\& (

&nbsp;       <div>

&nbsp;         <div style={styles.sectionTitle}>

&nbsp;           UPCOMING ({upcomingReminders.length})

&nbsp;         </div>

&nbsp;         {upcomingReminders.map(reminder => (

&nbsp;           <ReminderCard

&nbsp;             key={reminder.id}

&nbsp;             reminder={reminder}

&nbsp;             isDue={false}

&nbsp;             onComplete={handleComplete}

&nbsp;             onSnooze={handleSnooze}

&nbsp;             onDelete={handleDelete}

&nbsp;             formatDateTime={formatDateTime}

&nbsp;           />

&nbsp;         ))}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {completedReminders.length > 0 \&\& (

&nbsp;       <div>

&nbsp;         <div style={styles.sectionTitle}>

&nbsp;           COMPLETED ({completedReminders.length})

&nbsp;         </div>

&nbsp;         {completedReminders.map(reminder => (

&nbsp;           <ReminderCard

&nbsp;             key={reminder.id}

&nbsp;             reminder={reminder}

&nbsp;             isDue={false}

&nbsp;             onComplete={handleComplete}

&nbsp;             onSnooze={handleSnooze}

&nbsp;             onDelete={handleDelete}

&nbsp;             formatDateTime={formatDateTime}

&nbsp;             isCompleted={true}

&nbsp;           />

&nbsp;         ))}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {reminders.length === 0 \&\& (

&nbsp;       <div style={styles.emptyState}>

&nbsp;         <div style={styles.emptyIcon}>⏰</div>

&nbsp;         <div style={styles.emptyTitle}>No Reminders</div>

&nbsp;         <div style={styles.emptyMessage}>

&nbsp;           Create a reminder to help you remember important tasks

&nbsp;         </div>

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {showSetModal \&\& (

&nbsp;       <SetReminderModal

&nbsp;         onClose={() => setShowSetModal(false)}

&nbsp;         onSuccess={() => {

&nbsp;           setShowSetModal(false);

&nbsp;           loadReminders();

&nbsp;         }}

&nbsp;       />

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}

```



---



\### \*\*Reminder Card Component:\*\*



```javascript

function ReminderCard({ 

&nbsp; reminder, 

&nbsp; isDue, 

&nbsp; isCompleted, 

&nbsp; onComplete, 

&nbsp; onSnooze, 

&nbsp; onDelete,

&nbsp; formatDateTime 

}) {

&nbsp; const cardStyle = isCompleted 

&nbsp;   ? styles.reminderCardCompleted 

&nbsp;   : isDue 

&nbsp;   ? styles.reminderCardDue 

&nbsp;   : styles.reminderCard;



&nbsp; return (

&nbsp;   <div style={cardStyle}>

&nbsp;     <div style={styles.reminderTime}>

&nbsp;       {isDue \&\& '🔔 DUE NOW - '}

&nbsp;       {isCompleted \&\& '✅ '}

&nbsp;       {formatDateTime(reminder.remind\_at)}

&nbsp;     </div>



&nbsp;     <div style={styles.reminderTask}>

&nbsp;       {reminder.task}

&nbsp;     </div>



&nbsp;     {reminder.band\_name \&\& (

&nbsp;       <div style={styles.reminderContext}>

&nbsp;         {reminder.band\_name} - {reminder.item\_description}

&nbsp;         {reminder.current\_location \&\& ` (currently at ${reminder.current\_location})`}

&nbsp;         {reminder.performance\_location \&\& (

&nbsp;           <div>Performance: {reminder.performance\_location} at {reminder.performance\_time}</div>

&nbsp;         )}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {!isCompleted \&\& (

&nbsp;       <div style={styles.reminderActions}>

&nbsp;         <button

&nbsp;           onClick={() => onComplete(reminder.id)}

&nbsp;           style={styles.actionBtn}

&nbsp;         >

&nbsp;           Complete

&nbsp;         </button>

&nbsp;         {isDue \&\& (

&nbsp;           <>

&nbsp;             <button

&nbsp;               onClick={() => onSnooze(reminder.id, 10)}

&nbsp;               style={styles.actionBtnSecondary}

&nbsp;             >

&nbsp;               Snooze 10m

&nbsp;             </button>

&nbsp;             <button

&nbsp;               onClick={() => onSnooze(reminder.id, 30)}

&nbsp;               style={styles.actionBtnSecondary}

&nbsp;             >

&nbsp;               Snooze 30m

&nbsp;             </button>

&nbsp;           </>

&nbsp;         )}

&nbsp;         <button

&nbsp;           onClick={() => onDelete(reminder.id)}

&nbsp;           style={styles.actionBtnDelete}

&nbsp;         >

&nbsp;           Delete

&nbsp;         </button>

&nbsp;       </div>

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}

```



---



\### \*\*Set Reminder Modal:\*\*



```javascript

function SetReminderModal({ onClose, onSuccess, gearItem }) {

&nbsp; const db = useDatabase();

&nbsp; const { currentUser } = useAuth();

&nbsp; 

&nbsp; const \[task, setTask] = useState('');

&nbsp; const \[reminderDate, setReminderDate] = useState('');

&nbsp; const \[reminderTime, setReminderTime] = useState('');

&nbsp; const \[error, setError] = useState('');



&nbsp; useEffect(() => {

&nbsp;   // Set default to current date/time

&nbsp;   const now = new Date();

&nbsp;   setReminderDate(now.toISOString().split('T')\[0]);

&nbsp;   setReminderTime(now.toTimeString().slice(0, 5));

&nbsp; }, \[]);



&nbsp; const handleSubmit = async () => {

&nbsp;   if (!task.trim()) {

&nbsp;     setError('Task description is required');

&nbsp;     return;

&nbsp;   }



&nbsp;   if (!reminderDate || !reminderTime) {

&nbsp;     setError('Date and time are required');

&nbsp;     return;

&nbsp;   }



&nbsp;   try {

&nbsp;     const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);

&nbsp;     

&nbsp;     if (reminderDateTime < new Date()) {

&nbsp;       setError('Reminder time must be in the future');

&nbsp;       return;

&nbsp;     }



&nbsp;     // Get performance context if gear item provided

&nbsp;     let perfInfo = null;

&nbsp;     if (gearItem) {

&nbsp;       const performances = await db.performances

&nbsp;         .where('band\_id', '==', gearItem.band\_id)

&nbsp;         .toArray();

&nbsp;       

&nbsp;       const upcoming = performances

&nbsp;         .filter(p => {

&nbsp;           const perfTime = new Date(`${p.date}T${p.time}`);

&nbsp;           return perfTime > new Date();

&nbsp;         })

&nbsp;         .sort((a, b) => {

&nbsp;           const timeA = new Date(`${a.date}T${a.time}`);

&nbsp;           const timeB = new Date(`${b.date}T${b.time}`);

&nbsp;           return timeA - timeB;

&nbsp;         })\[0];

&nbsp;       

&nbsp;       if (upcoming) {

&nbsp;         const locations = await db.locations.toArray();

&nbsp;         const location = locations.find(l => l.id === upcoming.location\_id);

&nbsp;         perfInfo = {

&nbsp;           time: upcoming.time,

&nbsp;           location: location?.name

&nbsp;         };

&nbsp;       }

&nbsp;     }



&nbsp;     await db.reminders.add({

&nbsp;       user\_id: currentUser.uid,

&nbsp;       user\_email: currentUser.email,

&nbsp;       gear\_id: gearItem?.id || null,

&nbsp;       task: task.trim(),

&nbsp;       remind\_at: reminderDateTime,

&nbsp;       created\_at: new Date(),

&nbsp;       status: 'pending',

&nbsp;       completed\_at: null,

&nbsp;       snoozed\_until: null,

&nbsp;       band\_name: gearItem?.band\_id || null,

&nbsp;       item\_description: gearItem?.description || null,

&nbsp;       current\_location: gearItem?.current\_location\_id 

&nbsp;         ? (await db.locations.toArray()).find(l => l.id === gearItem.current\_location\_id)?.name

&nbsp;         : null,

&nbsp;       performance\_time: perfInfo?.time || null,

&nbsp;       performance\_location: perfInfo?.location || null

&nbsp;     });



&nbsp;     onSuccess();



&nbsp;   } catch (error) {

&nbsp;     console.error('Error creating reminder:', error);

&nbsp;     setError('Failed to create reminder');

&nbsp;   }

&nbsp; };



&nbsp; const setQuickTime = (minutesBefore) => {

&nbsp;   if (!gearItem) return;

&nbsp;   

&nbsp;   // Find next performance

&nbsp;   db.performances

&nbsp;     .where('band\_id', '==', gearItem.band\_id)

&nbsp;     .toArray()

&nbsp;     .then(performances => {

&nbsp;       const upcoming = performances

&nbsp;         .filter(p => {

&nbsp;           const perfTime = new Date(`${p.date}T${p.time}`);

&nbsp;           return perfTime > new Date();

&nbsp;         })

&nbsp;         .sort((a, b) => {

&nbsp;           const timeA = new Date(`${a.date}T${a.time}`);

&nbsp;           const timeB = new Date(`${b.date}T${b.time}`);

&nbsp;           return timeA - timeB;

&nbsp;         })\[0];

&nbsp;       

&nbsp;       if (upcoming) {

&nbsp;         const perfTime = new Date(`${upcoming.date}T${upcoming.time}`);

&nbsp;         const reminderTime = new Date(perfTime.getTime() - minutesBefore \* 60 \* 1000);

&nbsp;         

&nbsp;         setReminderDate(reminderTime.toISOString().split('T')\[0]);

&nbsp;         setReminderTime(reminderTime.toTimeString().slice(0, 5));

&nbsp;       }

&nbsp;     });

&nbsp; };



&nbsp; return (

&nbsp;   <div style={styles.modalOverlay} onClick={onClose}>

&nbsp;     <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>

&nbsp;       <div style={styles.modalHeader}>

&nbsp;         <h3 style={styles.modalTitle}>Set Reminder</h3>

&nbsp;       </div>



&nbsp;       {error \&\& (

&nbsp;         <div style={styles.errorBox}>

&nbsp;           {error}

&nbsp;         </div>

&nbsp;       )}



&nbsp;       {gearItem \&\& (

&nbsp;         <div style={styles.contextBox}>

&nbsp;           <div style={styles.contextLabel}>For:</div>

&nbsp;           <div style={styles.contextValue}>

&nbsp;             {gearItem.band\_id} - {gearItem.description}

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       )}



&nbsp;       <div style={styles.formGroup}>

&nbsp;         <label style={styles.label}>Task/Note \*</label>

&nbsp;         <textarea

&nbsp;           value={task}

&nbsp;           onChange={(e) => setTask(e.target.value)}

&nbsp;           placeholder="e.g., Move to Salty Dog Stage"

&nbsp;           maxLength={100}

&nbsp;           style={styles.textarea}

&nbsp;         />

&nbsp;         <div style={styles.charCount}>

&nbsp;           {task.length}/100 characters

&nbsp;         </div>

&nbsp;       </div>



&nbsp;       <div style={styles.formGroup}>

&nbsp;         <label style={styles.label}>Remind me at \*</label>

&nbsp;         <div style={styles.dateTimeRow}>

&nbsp;           <input

&nbsp;             type="date"

&nbsp;             value={reminderDate}

&nbsp;             onChange={(e) => setReminderDate(e.target.value)}

&nbsp;             style={styles.dateInput}

&nbsp;           />

&nbsp;           <input

&nbsp;             type="time"

&nbsp;             value={reminderTime}

&nbsp;             onChange={(e) => setReminderTime(e.target.value)}

&nbsp;             style={styles.timeInput}

&nbsp;           />

&nbsp;         </div>

&nbsp;       </div>



&nbsp;       {gearItem \&\& (

&nbsp;         <div style={styles.quickOptions}>

&nbsp;           <div style={styles.quickLabel}>Quick options:</div>

&nbsp;           <div style={styles.quickButtons}>

&nbsp;             <button onClick={() => setQuickTime(30)} style={styles.quickBtn}>

&nbsp;               30 mins before

&nbsp;             </button>

&nbsp;             <button onClick={() => setQuickTime(60)} style={styles.quickBtn}>

&nbsp;               1 hour before

&nbsp;             </button>

&nbsp;             <button onClick={() => setQuickTime(120)} style={styles.quickBtn}>

&nbsp;               2 hours before

&nbsp;             </button>

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       )}



&nbsp;       <div style={styles.modalButtons}>

&nbsp;         <button onClick={handleSubmit} style={styles.modalBtnPrimary}>

&nbsp;           Set Reminder

&nbsp;         </button>

&nbsp;         <button onClick={onClose} style={styles.modalBtnSecondary}>

&nbsp;           Cancel

&nbsp;         </button>

&nbsp;       </div>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}

```



---



\### \*\*Styles for Reminders:\*\*



```javascript

const styles = {

&nbsp; pageTitle: {

&nbsp;   fontSize: '16px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   marginBottom: '20px',

&nbsp;   textAlign: 'center'

&nbsp; },

&nbsp; 

&nbsp; message: {

&nbsp;   padding: '15px',

&nbsp;   marginBottom: '20px',

&nbsp;   background: 'rgba(76, 175, 80, 0.2)',

&nbsp;   color: '#4caf50',

&nbsp;   borderRadius: '6px',

&nbsp;   border: '2px solid #4caf50',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '600'

&nbsp; },

&nbsp; 

&nbsp; addBtn: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#ffa500',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   marginBottom: '30px'

&nbsp; },

&nbsp; 

&nbsp; sectionTitle: {

&nbsp;   fontSize: '13px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#888',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   marginTop: '24px',

&nbsp;   marginBottom: '12px'

&nbsp; },

&nbsp; 

&nbsp; reminderCard: {

&nbsp;   padding: '16px',

&nbsp;   marginBottom: '12px',

&nbsp;   background: '#2d2d2d',

&nbsp;   borderRadius: '8px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   borderLeft: '4px solid #ffa500'

&nbsp; },

&nbsp; 

&nbsp; reminderCardDue: {

&nbsp;   padding: '16px',

&nbsp;   marginBottom: '12px',

&nbsp;   background: '#2d2d2d',

&nbsp;   borderRadius: '8px',

&nbsp;   border: '2px solid #ff6b6b',

&nbsp;   borderLeft: '4px solid #ff6b6b',

&nbsp;   boxShadow: '0 0 12px rgba(255, 107, 107, 0.3)'

&nbsp; },

&nbsp; 

&nbsp; reminderCardCompleted: {

&nbsp;   padding: '16px',

&nbsp;   marginBottom: '12px',

&nbsp;   background: '#1a1a1a',

&nbsp;   borderRadius: '8px',

&nbsp;   border: '2px solid #2a2a2a',

&nbsp;   borderLeft: '4px solid #4caf50',

&nbsp;   opacity: 0.7

&nbsp; },

&nbsp; 

&nbsp; reminderTime: {

&nbsp;   fontSize: '13px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ffa500',

&nbsp;   marginBottom: '12px'

&nbsp; },

&nbsp; 

&nbsp; reminderTask: {

&nbsp;   fontSize: '15px',

&nbsp;   fontWeight: '600',

&nbsp;   color: '#e0e0e0',

&nbsp;   marginBottom: '8px',

&nbsp;   lineHeight: '1.4'

&nbsp; },

&nbsp; 

&nbsp; reminderContext: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888',

&nbsp;   marginBottom: '12px',

&nbsp;   lineHeight: '1.6'

&nbsp; },

&nbsp; 

&nbsp; reminderActions: {

&nbsp;   display: 'flex',

&nbsp;   gap: '8px',

&nbsp;   flexWrap: 'wrap'

&nbsp; },

&nbsp; 

&nbsp; actionBtn: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: '#4caf50',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '600',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; actionBtnSecondary: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: '#3a3a3a',

&nbsp;   color: '#ffa500',

&nbsp;   border: '1px solid #555',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '600',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; actionBtnDelete: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ff6b6b',

&nbsp;   border: '1px solid #ff6b6b',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '600',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; emptyState: {

&nbsp;   padding: '60px 20px',

&nbsp;   textAlign: 'center'

&nbsp; },

&nbsp; 

&nbsp; emptyIcon: {

&nbsp;   fontSize: '64px',

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; emptyTitle: {

&nbsp;   fontSize: '18px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '700',

&nbsp;   marginBottom: '12px',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; emptyMessage: {

&nbsp;   fontSize: '14px',

&nbsp;   color: '#888',

&nbsp;   lineHeight: '1.6'

&nbsp; },

&nbsp; 

&nbsp; loading: {

&nbsp;   padding: '40px',

&nbsp;   textAlign: 'center',

&nbsp;   color: '#888',

&nbsp;   fontSize: '14px'

&nbsp; },

&nbsp; 

&nbsp; // Modal styles

&nbsp; modalOverlay: {

&nbsp;   position: 'fixed',

&nbsp;   top: 0,

&nbsp;   left: 0,

&nbsp;   right: 0,

&nbsp;   bottom: 0,

&nbsp;   background: 'rgba(0, 0, 0, 0.85)',

&nbsp;   zIndex: 2000,

&nbsp;   display: 'flex',

&nbsp;   alignItems: 'center',

&nbsp;   justifyContent: 'center',

&nbsp;   padding: '20px'

&nbsp; },

&nbsp; 

&nbsp; modalCard: {

&nbsp;   background: '#2d2d2d',

&nbsp;   borderRadius: '12px',

&nbsp;   padding: '24px',

&nbsp;   maxWidth: '400px',

&nbsp;   width: '100%',

&nbsp;   border: '2px solid #ffa500'

&nbsp; },

&nbsp; 

&nbsp; modalHeader: {

&nbsp;   marginBottom: '20px',

&nbsp;   paddingBottom: '16px',

&nbsp;   borderBottom: '2px solid #3a3a3a'

&nbsp; },

&nbsp; 

&nbsp; modalTitle: {

&nbsp;   margin: 0,

&nbsp;   fontSize: '18px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ffa500',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; errorBox: {

&nbsp;   padding: '12px',

&nbsp;   marginBottom: '20px',

&nbsp;   background: 'rgba(244, 67, 54, 0.2)',

&nbsp;   color: '#ff6b6b',

&nbsp;   borderRadius: '6px',

&nbsp;   border: '2px solid #f44336',

&nbsp;   fontSize: '13px'

&nbsp; },

&nbsp; 

&nbsp; contextBox: {

&nbsp;   padding: '12px',

&nbsp;   marginBottom: '20px',

&nbsp;   background: '#1a1a1a',

&nbsp;   borderRadius: '6px',

&nbsp;   border: '1px solid #3a3a3a'

&nbsp; },

&nbsp; 

&nbsp; contextLabel: {

&nbsp;   fontSize: '11px',

&nbsp;   color: '#888',

&nbsp;   marginBottom: '4px',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; contextValue: {

&nbsp;   fontSize: '14px',

&nbsp;   color: '#e0e0e0',

&nbsp;   fontWeight: '600'

&nbsp; },

&nbsp; 

&nbsp; formGroup: {

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; label: {

&nbsp;   display: 'block',

&nbsp;   marginBottom: '8px',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ffa500',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; textarea: {

&nbsp;   width: '100%',

&nbsp;   minHeight: '80px',

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '4px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   backgroundColor: '#1a1a1a',

&nbsp;   color: '#e0e0e0',

&nbsp;   resize: 'vertical',

&nbsp;   fontFamily: 'inherit'

&nbsp; },

&nbsp; 

&nbsp; charCount: {

&nbsp;   fontSize: '11px',

&nbsp;   color: '#666',

&nbsp;   marginTop: '4px',

&nbsp;   textAlign: 'right'

&nbsp; },

&nbsp; 

&nbsp; dateTimeRow: {

&nbsp;   display: 'flex',

&nbsp;   gap: '10px'

&nbsp; },

&nbsp; 

&nbsp; dateInput: {

&nbsp;   flex: 1,

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '4px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   backgroundColor: '#1a1a1a',

&nbsp;   color: '#e0e0e0'

&nbsp; },

&nbsp; 

&nbsp; timeInput: {

&nbsp;   flex: 1,

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '4px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   backgroundColor: '#1a1a1a',

&nbsp;   color: '#e0e0e0'

&nbsp; },

&nbsp; 

&nbsp; quickOptions: {

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; quickLabel: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888',

&nbsp;   marginBottom: '8px'

&nbsp; },

&nbsp; 

&nbsp; quickButtons: {

&nbsp;   display: 'flex',

&nbsp;   gap: '8px',

&nbsp;   flexWrap: 'wrap'

&nbsp; },

&nbsp; 

&nbsp; quickBtn: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: '#3a3a3a',

&nbsp;   color: '#ffa500',

&nbsp;   border: '1px solid #555',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '11px',

&nbsp;   fontWeight: '600',

&nbsp;   cursor: 'pointer'

&nbsp; },

&nbsp; 

&nbsp; modalButtons: {

&nbsp;   display: 'flex',

&nbsp;   flexDirection: 'column',

&nbsp;   gap: '10px'

&nbsp; },

&nbsp; 

&nbsp; modalBtnPrimary: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#ffa500',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; modalBtnSecondary: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ffa500',

&nbsp;   border: '2px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; }

};

```



---



\## \*\*🏠 ADD TO APP.JSX\*\*



\*\*Add Reminders button and check function:\*\*



```javascript

const \[pendingRemindersCount, setPendingRemindersCount] = useState(0);

const \[dueRemindersCount, setDueRemindersCount] = useState(0);



// Check reminders every minute

const checkReminders = useCallback(async () => {

&nbsp; if (!db || !currentUser) return;

&nbsp; 

&nbsp; try {

&nbsp;   const reminders = await db.reminders

&nbsp;     .where('user\_id', '==', currentUser.uid)

&nbsp;     .where('status', '==', 'pending')

&nbsp;     .toArray();

&nbsp;   

&nbsp;   const now = new Date();

&nbsp;   let dueCount = 0;

&nbsp;   

&nbsp;   reminders.forEach(reminder => {

&nbsp;     const remindTime = reminder.remind\_at.toDate 

&nbsp;       ? reminder.remind\_at.toDate() 

&nbsp;       : new Date(reminder.remind\_at);

&nbsp;     

&nbsp;     // Check if snoozed

&nbsp;     if (reminder.snoozed\_until) {

&nbsp;       const snoozeTime = reminder.snoozed\_until.toDate 

&nbsp;         ? reminder.snoozed\_until.toDate() 

&nbsp;         : new Date(reminder.snoozed\_until);

&nbsp;       

&nbsp;       if (snoozeTime <= now) {

&nbsp;         dueCount++;

&nbsp;       }

&nbsp;     } else if (remindTime <= now) {

&nbsp;       dueCount++;

&nbsp;     }

&nbsp;   });

&nbsp;   

&nbsp;   setPendingRemindersCount(reminders.length);

&nbsp;   setDueRemindersCount(dueCount);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error checking reminders:', error);

&nbsp; }

}, \[db, currentUser]);



useEffect(() => {

&nbsp; checkReminders();

&nbsp; const interval = setInterval(checkReminders, 60 \* 1000);

&nbsp; return () => clearInterval(interval);

}, \[checkReminders]);



// Home button

<div style={styles.homeButton} onClick={() => setActiveTab('reminders')}>

&nbsp; <span style={styles.homeButtonIcon}>⏰</span>

&nbsp; <div style={styles.homeButtonText}>Reminders</div>

&nbsp; <div style={styles.homeButtonDesc}>My Tasks</div>

&nbsp; {dueRemindersCount > 0 \&\& (

&nbsp;   <div style={styles.notificationBadge}>

&nbsp;     {dueRemindersCount}

&nbsp;   </div>

&nbsp; )}

</div>



// Route

{activeTab === 'reminders' \&\& (

&nbsp; <div>

&nbsp;   <Reminders />

&nbsp;   <button

&nbsp;     onClick={() => {

&nbsp;       setActiveTab('home');

&nbsp;       checkReminders(); // Refresh count

&nbsp;     }}

&nbsp;     style={styles.backButton}

&nbsp;   >

&nbsp;     Back to Home

&nbsp;   </button>

&nbsp; </div>

)}

```



---



\## \*\*✅ TESTING CHECKLIST - REMINDERS\*\*



\- \[ ] Can create reminder

\- \[ ] Can create reminder from gear item

\- \[ ] Quick time buttons work (30min, 1hr, 2hr before)

\- \[ ] Due reminders show at top with red styling

\- \[ ] Badge shows due count on home

\- \[ ] Complete removes from pending

\- \[ ] Snooze works (10min, 30min)

\- \[ ] Delete works with confirmation

\- \[ ] Empty state displays correctly

\- \[ ] Check interval works (every minute)

\- \[ ] Completed reminders show in separate section

\- \[ ] Past reminder time validation works

\- \[ ] Character limit enforced (100 chars)

\- \[ ] Performance context displays correctly



---



\## \*\*📋 IMPLEMENTATION SUMMARY\*\*



\*\*Database Collections:\*\*

1\. `bands` - Band registry from schedule

2\. `reminders` - Personal user reminders

3\. `invitations` - User invitations (already exists, enhanced for bulk)



\*\*New Files:\*\*

1\. `/src/utils/bandNormalization.js` - Band name normalization

2\. `/src/components/UserManagement.jsx` - User management page

3\. `/src/components/Reminders.jsx` - Reminders page



\*\*Updated Files:\*\*

1\. `Schedule.jsx` - Extract bands on CSV upload

2\. `RegisterGear.jsx` - Autocomplete from band registry

3\. `GearList.jsx` - Group by normalized, add schedule icon

4\. `App.jsx` - Add Users and Reminders buttons/routes

5\. `firestoreDb.js` - Add bands and reminders collections



\*\*Features:\*\*

\- ✅ Band registry from schedule

\- ✅ Autocomplete in gear registration

\- ✅ Schedule icon in gear list

\- ✅ Bulk user CSV upload

\- ✅ Personal reminders (no modals)

\- ✅ Badge notifications only



---



\*\*Ready for Claude Code implementation!\*\* 🚀

