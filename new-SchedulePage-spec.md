\## \*\*📅 SCHEDULE PAGE REDESIGN - COMPLETE SPECIFICATION\*\*



---



\## \*\*🎯 OVERVIEW\*\*



Redesign the Schedule page to be a simple reference tool with bulk CSV upload. Remove all manual editing capabilities. Implement three-level collapsible structure (Day → Stage → Performance) with band search and time format toggle.



---



\## \*\*🗄️ DATABASE STRUCTURE\*\*



\### \*\*Current Structure: `festivals/{festivalId}/performances`\*\*



\*\*KEEP AS IS:\*\*

```javascript

{

&nbsp; id: "perf\_abc123",           // Auto-generated

&nbsp; band\_id: "The Rockers",      // Band name

&nbsp; location\_id: 2,              // Stage/location ID (number)

&nbsp; date: "2025-11-08",          // Date in YYYY-MM-DD format

&nbsp; time: "20:00"                // Time in 24hr format HH:MM

}

```



\*\*NO CHANGES NEEDED\*\* - Current structure already supports our requirements.



---



\## \*\*📤 CSV UPLOAD SPECIFICATION\*\*



\### \*\*CSV Format\*\*



\*\*File Requirements:\*\*

\- File extension: `.csv`

\- Encoding: UTF-8

\- Header row: Optional (will be skipped if detected)



\*\*Column Order (4 columns):\*\*

```

Band Name, Stage, Date, Time

```



\*\*Example CSV:\*\*

```csv

Band Name, Stage, Date, Time

The Rockers, Salty Dog, 08-11-2025, 18:00

Jazz Collective, Salty Dog, 08-11-2025, 20:00

Rock Band, Salty Dog, 08-11-2025, 22:00

The Rockers, Providencia, 09-11-2025, 19:00

Electronic Act, Providencia, 08-11-2025, 19:00

Folk Duo, Salty Dog, 09-11-2025, 17:00

Hip Hop Crew, Providencia, 08-11-2025, 21:30

DJ Set, Providencia, 09-11-2025, 18:00

```



\*\*Data Format Rules:\*\*

\- \*\*Band Name:\*\* Any text, will be trimmed

\- \*\*Stage:\*\* Must match existing location name (case-insensitive)

\- \*\*Date:\*\* Format `DD-MM-YYYY` (will convert to `YYYY-MM-DD` for storage)

\- \*\*Time:\*\* Format `HH:MM` in 24-hour format (e.g., `18:00`, `09:30`)



---



\### \*\*Validation Rules\*\*



\*\*Pre-Upload Validation:\*\*

1\. File must be `.csv` extension

2\. Must have at least 1 data row (excluding header)

3\. Each row must have exactly 4 columns

4\. No completely empty rows



\*\*Per-Row Validation:\*\*

1\. \*\*Band Name:\*\* Cannot be empty after trimming

2\. \*\*Stage:\*\* Must match existing location name (load from `db.locations.toArray()`)

3\. \*\*Date:\*\* Must match `DD-MM-YYYY` format and be valid date

4\. \*\*Time:\*\* Must match `HH:MM` format (00:00 to 23:59)



\*\*Validation Error Handling:\*\*

\- Show errors with row numbers: "Row 5: Invalid date format"

\- Show unrecognized stages: "Stage 'Main Stage' not found. Create it first in Location Manager?"

\- Allow user to cancel or fix CSV and re-upload

\- Do NOT import if ANY validation errors exist



---



\### \*\*Upload Flow\*\*



\*\*Step 1: Click Upload Button\*\*

```

\[📤 Upload Schedule] button (admin/owner only)

```



\*\*Step 2: File Selection\*\*

```

File picker dialog → User selects .csv file

```



\*\*Step 3: Parse \& Validate\*\*

```

\- Read CSV file

\- Detect and skip header row if present

\- Parse each line

\- Validate all rows

\- Check stages exist in Location Manager

```



\*\*Step 4: Show Preview (If Valid)\*\*

```

┌─────────────────────────────────────────┐

│ 📋 Schedule Preview                     │

├─────────────────────────────────────────┤

│ 8 performances ready to import          │

│                                         │

│ Day 1 (Fri 08 Nov): 5 performances     │

│ Day 2 (Sat 09 Nov): 3 performances     │

│                                         │

│ Stages: Salty Dog (5), Providencia (3) │

│                                         │

│ ⚠️ This will DELETE all existing       │

│    schedule data and replace it.        │

│                                         │

│ \[✓ Confirm Import] \[✗ Cancel]          │

└─────────────────────────────────────────┘

```



\*\*Step 5: Import (On Confirm)\*\*

```

1\. Delete all existing performances: 

&nbsp;  await db.performances.toArray() → delete each

&nbsp;  

2\. Add new performances:

&nbsp;  For each CSV row:

&nbsp;    - Convert date DD-MM-YYYY → YYYY-MM-DD

&nbsp;    - Look up location\_id from stage name

&nbsp;    - Add to db.performances

&nbsp;    

3\. Show success message:

&nbsp;  "✓ Schedule imported: 8 performances added"

```



\*\*Step 6: Refresh Display\*\*

```

Load new schedule data and display

Current day auto-expanded

```



---



\### \*\*Error Handling Examples\*\*



\*\*Stage Not Found:\*\*

```

❌ Import Failed



Row 3: Stage "Main Stage" not found.



Available stages:

• Salty Dog

• Providencia  

• Trailer Park



Please create "Main Stage" in Location Manager first,

or update your CSV to use existing stage names.



\[OK]

```



\*\*Invalid Date Format:\*\*

```

❌ Import Failed



Row 5: Invalid date "8-11-2025"

Expected format: DD-MM-YYYY (e.g., 08-11-2025)



Row 7: Invalid date "32-11-2025"  

Day must be between 01-31



\[OK]

```



\*\*Invalid Time Format:\*\*

```

❌ Import Failed



Row 4: Invalid time "8:00"

Expected format: HH:MM (e.g., 08:00, 18:30)



Row 9: Invalid time "25:00"

Hour must be between 00-23



\[OK]

```



---



\## \*\*🎨 UI STRUCTURE\*\*



\### \*\*Page Layout\*\*



```

┌─────────────────────────────────────────────┐

│ Festival Gear Tracker                       │

│ Organising Chaos Like a Pro                │

├─────────────────────────────────────────────┤

│ Active: 18  Transit: 3  Checked Out: 3     │

├─────────────────────────────────────────────┤

│                                             │

│ \[🔍 Find band: \_\_\_\_\_\_\_\_\_\_▼] \[🕐 24hr⟷12hr]│

│                                             │

│ {isAdminOrOwner \&\& (                        │

│   \[📤 Upload Schedule]                      │

│ )}                                          │

│                                             │

│ ▼ Day 1 - Friday 8 November 2025      (14) │

│                                             │

│   ▼ The Salty Dog Stage                (8) │

│     18:00 | The Rockers                     │

│     20:00 | Jazz Collective                 │

│     22:00 | Rock Band                       │

│                                             │

│   ▶ Providencia Stage                  (6) │

│                                             │

│ ▶ Day 2 - Saturday 9 November 2025    (12) │

│                                             │

│ ▶ Day 3 - Sunday 10 November 2025     (10) │

│                                             │

│ \[← Back to Home]                            │

└─────────────────────────────────────────────┘

```



---



\### \*\*Empty State (No Schedule)\*\*



```

┌─────────────────────────────────────────────┐

│                                             │

│              📅                             │

│                                             │

│      No Schedule Available                  │

│                                             │

│  {isAdminOrOwner ? (                        │

│    "Upload a CSV file to create the         │

│     festival schedule."                     │

│                                             │

│    \[📤 Upload Schedule]                     │

│  ) : (                                      │

│    "Schedule not yet available.             │

│     Check back later."                      │

│  )}                                         │

│                                             │

│ \[← Back to Home]                            │

└─────────────────────────────────────────────┘

```



---



\## \*\*🔧 COMPONENT IMPLEMENTATION\*\*



\### \*\*Component Structure\*\*



\*\*File:\*\* `/src/components/Schedule.jsx`



\*\*State Variables:\*\*

```javascript

const \[performances, setPerformances] = useState(\[]);

const \[locations, setLocations] = useState(\[]);

const \[expandedDays, setExpandedDays] = useState({});

const \[expandedStages, setExpandedStages] = useState({});

const \[bandFilter, setBandFilter] = useState('');

const \[timeFormat, setTimeFormat] = useState('24hr'); // '24hr' or '12hr'

const \[showUploadModal, setShowUploadModal] = useState(false);

const \[csvFile, setCsvFile] = useState(null);

const \[csvPreview, setCsvPreview] = useState(null);

const \[message, setMessage] = useState('');

const \[loading, setLoading] = useState(false);

```



\*\*Helper Functions Needed:\*\*

```javascript

const { isAdminOrOwner } = useRole();

const db = useDatabase();



// Group performances by day

const groupByDay = (perfs) => { /\* ... \*/ }



// Group performances by stage within a day

const groupByStage = (perfs) => { /\* ... \*/ }



// Format date display: "Friday 8 November 2025"

const formatDateDisplay = (dateString) => { /\* ... \*/ }



// Format time: "18:00" or "6:00 PM"

const formatTime = (time24hr) => { /\* ... \*/ }



// Convert DD-MM-YYYY to YYYY-MM-DD

const convertDateFormat = (ddmmyyyy) => { /\* ... \*/ }



// Validate CSV row

const validateRow = (row, locations) => { /\* ... \*/ }



// Parse CSV file

const parseCSV = async (file) => { /\* ... \*/ }



// Get current day

const getCurrentDay = () => { /\* ... \*/ }



// Auto-expand current day

const autoExpandCurrentDay = (days) => { /\* ... \*/ }

```



---



\### \*\*Data Structure After Grouping\*\*



```javascript

// After groupByDay and groupByStage:

{

&nbsp; "2025-11-08": {

&nbsp;   displayDate: "Friday 8 November 2025",

&nbsp;   performances: \[...],

&nbsp;   stages: {

&nbsp;     "2": {  // location\_id

&nbsp;       name: "Salty Dog",

&nbsp;       color: "#e74c3c",

&nbsp;       performances: \[

&nbsp;         { band\_id: "The Rockers", time: "18:00", ... },

&nbsp;         { band\_id: "Jazz Collective", time: "20:00", ... }

&nbsp;       ]

&nbsp;     },

&nbsp;     "3": { /\* ... \*/ }

&nbsp;   }

&nbsp; },

&nbsp; "2025-11-09": { /\* ... \*/ }

}

```



---



\### \*\*Time Format Toggle\*\*



\*\*Implementation:\*\*

```javascript

const \[timeFormat, setTimeFormat] = useState('24hr');



const formatTime = (time24hr) => {

&nbsp; if (timeFormat === '24hr') {

&nbsp;   return time24hr; // "18:00"

&nbsp; } else {

&nbsp;   // Convert to 12hr format

&nbsp;   const \[hours, minutes] = time24hr.split(':');

&nbsp;   const hour = parseInt(hours);

&nbsp;   const ampm = hour >= 12 ? 'PM' : 'AM';

&nbsp;   const hour12 = hour % 12 || 12;

&nbsp;   return `${hour12}:${minutes} ${ampm}`; // "6:00 PM"

&nbsp; }

};



const toggleTimeFormat = () => {

&nbsp; setTimeFormat(prev => prev === '24hr' ? '12hr' : '24hr');

};

```



\*\*Toggle Button:\*\*

```javascript

<button 

&nbsp; onClick={toggleTimeFormat}

&nbsp; style={styles.timeToggle}

>

&nbsp; 🕐 {timeFormat === '24hr' ? '24hr ⟷ 12hr' : '12hr ⟷ 24hr'}

</button>

```



---



\### \*\*Collapsible Structure Implementation\*\*



\*\*Day Level:\*\*

```javascript

const toggleDay = (dateKey) => {

&nbsp; setExpandedDays(prev => ({

&nbsp;   ...prev,

&nbsp;   \[dateKey]: !prev\[dateKey]

&nbsp; }));

};



// Render:

<div 

&nbsp; style={styles.dayHeader}

&nbsp; onClick={() => toggleDay(dateKey)}

>

&nbsp; <span>{expandedDays\[dateKey] ? '▼' : '▶'}</span>

&nbsp; <span>Day {index + 1} - {day.displayDate}</span>

&nbsp; <span>({totalPerformances})</span>

</div>



{expandedDays\[dateKey] \&\& (

&nbsp; <div style={styles.dayContent}>

&nbsp;   {/\* Stage groups here \*/}

&nbsp; </div>

)}

```



\*\*Stage Level:\*\*

```javascript

const toggleStage = (dateKey, stageId) => {

&nbsp; const key = `${dateKey}-${stageId}`;

&nbsp; setExpandedStages(prev => ({

&nbsp;   ...prev,

&nbsp;   \[key]: !prev\[key]

&nbsp; }));

};



// Render:

<div 

&nbsp; style={styles.stageHeader}

&nbsp; onClick={() => toggleStage(dateKey, stageId)}

>

&nbsp; <span>{expandedStages\[stageKey] ? '▼' : '▶'}</span>

&nbsp; <span>{stage.name}</span>

&nbsp; <span>({stage.performances.length})</span>

</div>



{expandedStages\[stageKey] \&\& (

&nbsp; <div style={styles.stageContent}>

&nbsp;   {stage.performances.map(perf => (

&nbsp;     <div style={styles.performanceItem}>

&nbsp;       {formatTime(perf.time)} | {perf.band\_id}

&nbsp;     </div>

&nbsp;   ))}

&nbsp; </div>

)}

```



---



\### \*\*Auto-Expand Current Day\*\*



\*\*On Component Mount:\*\*

```javascript

useEffect(() => {

&nbsp; loadSchedule();

}, \[]);



const loadSchedule = async () => {

&nbsp; const perfs = await db.performances.toArray();

&nbsp; setPerformances(perfs);

&nbsp; 

&nbsp; // Auto-expand current day

&nbsp; const today = new Date().toISOString().split('T')\[0]; // "2025-11-08"

&nbsp; const grouped = groupByDay(perfs);

&nbsp; 

&nbsp; if (grouped\[today]) {

&nbsp;   setExpandedDays({ \[today]: true });

&nbsp; } else {

&nbsp;   // If no performances today, expand first day with performances

&nbsp;   const firstDay = Object.keys(grouped).sort()\[0];

&nbsp;   if (firstDay) {

&nbsp;     setExpandedDays({ \[firstDay]: true });

&nbsp;   }

&nbsp; }

};

```



---



\### \*\*Band Filter\*\*



\*\*Implementation:\*\*

```javascript

const \[bandFilter, setBandFilter] = useState('');



// Get unique band names

const uniqueBands = \[...new Set(performances.map(p => p.band\_id))].sort();



// Filter performances

const filteredPerformances = bandFilter

&nbsp; ? performances.filter(p => p.band\_id === bandFilter)

&nbsp; : performances;



// Render dropdown:

<select 

&nbsp; value={bandFilter}

&nbsp; onChange={(e) => setBandFilter(e.target.value)}

&nbsp; style={styles.bandFilter}

>

&nbsp; <option value="">All Bands</option>

&nbsp; {uniqueBands.map(band => (

&nbsp;   <option key={band} value={band}>{band}</option>

&nbsp; ))}

</select>

```



\*\*When Band Selected:\*\*

```javascript

// Show filtered results in simple list (not collapsible):

{bandFilter \&\& (

&nbsp; <div style={styles.filterResults}>

&nbsp;   <h3>Performances by {bandFilter}</h3>

&nbsp;   {filteredPerformances.map(perf => (

&nbsp;     <div style={styles.filterResultItem}>

&nbsp;       <div>{formatDateDisplay(perf.date)}</div>

&nbsp;       <div>{getLocationName(perf.location\_id)}</div>

&nbsp;       <div>{formatTime(perf.time)}</div>

&nbsp;     </div>

&nbsp;   ))}

&nbsp; </div>

)}

```



---



\## \*\*🎨 STYLING\*\*



\### \*\*Design System Colors (Dark Theme)\*\*



```javascript

const styles = {

&nbsp; pageContainer: {

&nbsp;   // No styles needed - inherits from App.jsx container

&nbsp; },

&nbsp; 

&nbsp; topBar: {

&nbsp;   display: 'flex',

&nbsp;   justifyContent: 'space-between',

&nbsp;   alignItems: 'center',

&nbsp;   marginBottom: '16px',

&nbsp;   gap: '10px',

&nbsp;   flexWrap: 'wrap'

&nbsp; },

&nbsp; 

&nbsp; bandFilter: {

&nbsp;   flex: 1,

&nbsp;   minWidth: '150px',

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '4px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   backgroundColor: '#2d2d2d',

&nbsp;   color: '#e0e0e0'

&nbsp; },

&nbsp; 

&nbsp; timeToggle: {

&nbsp;   padding: '12px 16px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ffa500',

&nbsp;   border: '2px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   whiteSpace: 'nowrap'

&nbsp; },

&nbsp; 

&nbsp; uploadButton: {

&nbsp;   width: '100%',

&nbsp;   padding: '16px',

&nbsp;   backgroundColor: '#ffa500',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   marginBottom: '16px'

&nbsp; },

&nbsp; 

&nbsp; dayHeader: {

&nbsp;   padding: '14px 16px',

&nbsp;   cursor: 'pointer',

&nbsp;   display: 'flex',

&nbsp;   justifyContent: 'space-between',

&nbsp;   alignItems: 'center',

&nbsp;   background: '#2d2d2d',

&nbsp;   borderLeft: '4px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   marginBottom: '12px'

&nbsp; },

&nbsp; 

&nbsp; dayTitle: {

&nbsp;   fontSize: '15px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; dayCount: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888',

&nbsp;   background: '#1a1a1a',

&nbsp;   padding: '4px 10px',

&nbsp;   borderRadius: '3px'

&nbsp; },

&nbsp; 

&nbsp; dayContent: {

&nbsp;   paddingLeft: '16px',

&nbsp;   marginBottom: '12px'

&nbsp; },

&nbsp; 

&nbsp; stageHeader: {

&nbsp;   padding: '12px 16px',

&nbsp;   cursor: 'pointer',

&nbsp;   display: 'flex',

&nbsp;   justifyContent: 'space-between',

&nbsp;   alignItems: 'center',

&nbsp;   background: '#2d2d2d',

&nbsp;   borderLeft: '4px solid', // Color from location

&nbsp;   borderRadius: '4px',

&nbsp;   marginBottom: '8px'

&nbsp; },

&nbsp; 

&nbsp; stageName: {

&nbsp;   fontSize: '14px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '600',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; stageCount: {

&nbsp;   fontSize: '11px',

&nbsp;   color: '#888',

&nbsp;   background: '#1a1a1a',

&nbsp;   padding: '3px 8px',

&nbsp;   borderRadius: '3px'

&nbsp; },

&nbsp; 

&nbsp; stageContent: {

&nbsp;   paddingLeft: '16px',

&nbsp;   marginBottom: '8px'

&nbsp; },

&nbsp; 

&nbsp; performanceItem: {

&nbsp;   padding: '10px 12px',

&nbsp;   background: '#1a1a1a',

&nbsp;   borderRadius: '4px',

&nbsp;   marginBottom: '4px',

&nbsp;   fontSize: '13px',

&nbsp;   color: '#e0e0e0',

&nbsp;   display: 'flex',

&nbsp;   gap: '12px'

&nbsp; },

&nbsp; 

&nbsp; performanceTime: {

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '600',

&nbsp;   minWidth: '60px'

&nbsp; },

&nbsp; 

&nbsp; performanceBand: {

&nbsp;   color: '#ccc'

&nbsp; },

&nbsp; 

&nbsp; emptyState: {

&nbsp;   padding: '60px 20px',

&nbsp;   textAlign: 'center',

&nbsp;   color: '#888'

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

&nbsp;   marginBottom: '24px',

&nbsp;   lineHeight: '1.6'

&nbsp; },

&nbsp; 

&nbsp; message: {

&nbsp;   padding: '16px',

&nbsp;   marginBottom: '20px',

&nbsp;   background: message.includes('Error') || message.includes('Failed') 

&nbsp;     ? 'rgba(244, 67, 54, 0.2)' 

&nbsp;     : 'rgba(76, 175, 80, 0.2)',

&nbsp;   color: message.includes('Error') || message.includes('Failed')

&nbsp;     ? '#ff6b6b'

&nbsp;     : '#4caf50',

&nbsp;   borderRadius: '6px',

&nbsp;   border: message.includes('Error') || message.includes('Failed')

&nbsp;     ? '2px solid #f44336'

&nbsp;     : '2px solid #4caf50',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '600'

&nbsp; }

};

```



---



\## \*\*🔄 CSV UPLOAD IMPLEMENTATION DETAILS\*\*



\### \*\*File Selection Handler\*\*



```javascript

const handleFileSelect = (e) => {

&nbsp; const file = e.target.files\[0];

&nbsp; 

&nbsp; if (!file) return;

&nbsp; 

&nbsp; if (!file.name.endsWith('.csv')) {

&nbsp;   setMessage('❌ Please select a CSV file');

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   return;

&nbsp; }

&nbsp; 

&nbsp; setCsvFile(file);

&nbsp; parseAndValidateCSV(file);

};

```



---



\### \*\*CSV Parser\*\*



```javascript

const parseAndValidateCSV = async (file) => {

&nbsp; try {

&nbsp;   setLoading(true);

&nbsp;   

&nbsp;   const text = await file.text();

&nbsp;   const lines = text.split('\\n').filter(line => line.trim());

&nbsp;   

&nbsp;   if (lines.length === 0) {

&nbsp;     setMessage('❌ CSV file is empty');

&nbsp;     setLoading(false);

&nbsp;     return;

&nbsp;   }

&nbsp;   

&nbsp;   // Detect header row (if first row contains "Band" or "Stage")

&nbsp;   const firstLine = lines\[0].toLowerCase();

&nbsp;   const hasHeader = firstLine.includes('band') || firstLine.includes('stage');

&nbsp;   const dataLines = hasHeader ? lines.slice(1) : lines;

&nbsp;   

&nbsp;   // Load locations for validation

&nbsp;   const locations = await db.locations.toArray();

&nbsp;   const locationNames = locations.map(loc => loc.name.toLowerCase());

&nbsp;   

&nbsp;   const validatedRows = \[];

&nbsp;   const errors = \[];

&nbsp;   

&nbsp;   dataLines.forEach((line, index) => {

&nbsp;     const rowNum = hasHeader ? index + 2 : index + 1;

&nbsp;     

&nbsp;     if (!line.trim()) return; // Skip empty lines

&nbsp;     

&nbsp;     // Parse CSV (handle quoted values)

&nbsp;     const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

&nbsp;     

&nbsp;     if (parts.length !== 4) {

&nbsp;       errors.push(`Row ${rowNum}: Expected 4 columns, got ${parts.length}`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     const \[bandName, stageName, dateStr, timeStr] = parts;

&nbsp;     

&nbsp;     // Validate band name

&nbsp;     if (!bandName) {

&nbsp;       errors.push(`Row ${rowNum}: Band name is required`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     // Validate stage exists

&nbsp;     const stageNameLower = stageName.toLowerCase();

&nbsp;     if (!locationNames.includes(stageNameLower)) {

&nbsp;       errors.push(`Row ${rowNum}: Stage "${stageName}" not found`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     // Validate date format DD-MM-YYYY

&nbsp;     const dateRegex = /^(\\d{2})-(\\d{2})-(\\d{4})$/;

&nbsp;     const dateMatch = dateStr.match(dateRegex);

&nbsp;     if (!dateMatch) {

&nbsp;       errors.push(`Row ${rowNum}: Invalid date "${dateStr}". Use DD-MM-YYYY format`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     const \[\_, day, month, year] = dateMatch;

&nbsp;     const dayNum = parseInt(day);

&nbsp;     const monthNum = parseInt(month);

&nbsp;     

&nbsp;     if (dayNum < 1 || dayNum > 31) {

&nbsp;       errors.push(`Row ${rowNum}: Day must be between 01-31`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     if (monthNum < 1 || monthNum > 12) {

&nbsp;       errors.push(`Row ${rowNum}: Month must be between 01-12`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     // Convert to YYYY-MM-DD for storage

&nbsp;     const dateFormatted = `${year}-${month}-${day}`;

&nbsp;     

&nbsp;     // Validate time format HH:MM

&nbsp;     const timeRegex = /^(\[0-1]\\d|2\[0-3]):(\[0-5]\\d)$/;

&nbsp;     if (!timeRegex.test(timeStr)) {

&nbsp;       errors.push(`Row ${rowNum}: Invalid time "${timeStr}". Use HH:MM format (00:00-23:59)`);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     // Find location ID

&nbsp;     const location = locations.find(loc => 

&nbsp;       loc.name.toLowerCase() === stageNameLower

&nbsp;     );

&nbsp;     

&nbsp;     validatedRows.push({

&nbsp;       band\_id: bandName.trim(),

&nbsp;       location\_id: location.id,

&nbsp;       locationName: location.name,

&nbsp;       date: dateFormatted,

&nbsp;       time: timeStr

&nbsp;     });

&nbsp;   });

&nbsp;   

&nbsp;   if (errors.length > 0) {

&nbsp;     setMessage(`❌ Import Failed\\n\\n${errors.join('\\n')}`);

&nbsp;     setLoading(false);

&nbsp;     return;

&nbsp;   }

&nbsp;   

&nbsp;   // Generate preview

&nbsp;   const preview = generatePreview(validatedRows);

&nbsp;   setCsvPreview(preview);

&nbsp;   setShowUploadModal(true);

&nbsp;   setLoading(false);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('CSV parse error:', error);

&nbsp;   setMessage('❌ Error reading CSV file: ' + error.message);

&nbsp;   setLoading(false);

&nbsp; }

};

```



---



\### \*\*Preview Generator\*\*



```javascript

const generatePreview = (rows) => {

&nbsp; // Group by date

&nbsp; const byDate = {};

&nbsp; rows.forEach(row => {

&nbsp;   if (!byDate\[row.date]) {

&nbsp;     byDate\[row.date] = \[];

&nbsp;   }

&nbsp;   byDate\[row.date].push(row);

&nbsp; });

&nbsp; 

&nbsp; // Group by stage

&nbsp; const byStage = {};

&nbsp; rows.forEach(row => {

&nbsp;   if (!byStage\[row.locationName]) {

&nbsp;     byStage\[row.locationName] = 0;

&nbsp;   }

&nbsp;   byStage\[row.locationName]++;

&nbsp; });

&nbsp; 

&nbsp; return {

&nbsp;   totalPerformances: rows.length,

&nbsp;   dayBreakdown: Object.entries(byDate).map((\[date, perfs]) => ({

&nbsp;     date,

&nbsp;     displayDate: formatDateDisplay(date),

&nbsp;     count: perfs.length

&nbsp;   })),

&nbsp;   stageBreakdown: Object.entries(byStage).map((\[stage, count]) => ({

&nbsp;     stage,

&nbsp;     count

&nbsp;   }))

&nbsp; };

};

```



---



\### \*\*Import Confirmation Modal\*\*



```javascript

{showUploadModal \&\& csvPreview \&\& (

&nbsp; <div style={styles.modalOverlay}>

&nbsp;   <div style={styles.modalCard}>

&nbsp;     <h3 style={styles.modalTitle}>📋 Schedule Preview</h3>

&nbsp;     

&nbsp;     <div style={styles.previewStats}>

&nbsp;       <p>{csvPreview.totalPerformances} performances ready to import</p>

&nbsp;       

&nbsp;       <div style={styles.previewSection}>

&nbsp;         <strong>By Day:</strong>

&nbsp;         {csvPreview.dayBreakdown.map(day => (

&nbsp;           <div key={day.date}>

&nbsp;             {day.displayDate}: {day.count} performances

&nbsp;           </div>

&nbsp;         ))}

&nbsp;       </div>

&nbsp;       

&nbsp;       <div style={styles.previewSection}>

&nbsp;         <strong>By Stage:</strong>

&nbsp;         {csvPreview.stageBreakdown.map(stage => (

&nbsp;           <div key={stage.stage}>

&nbsp;             {stage.stage}: {stage.count} performances

&nbsp;           </div>

&nbsp;         ))}

&nbsp;       </div>

&nbsp;       

&nbsp;       <div style={styles.warningBox}>

&nbsp;         ⚠️ This will DELETE all existing schedule data and replace it.

&nbsp;       </div>

&nbsp;     </div>

&nbsp;     

&nbsp;     <div style={styles.modalButtons}>

&nbsp;       <button 

&nbsp;         onClick={handleConfirmImport}

&nbsp;         style={styles.confirmButton}

&nbsp;       >

&nbsp;         ✓ Confirm Import

&nbsp;       </button>

&nbsp;       <button 

&nbsp;         onClick={handleCancelImport}

&nbsp;         style={styles.cancelButton}

&nbsp;       >

&nbsp;         ✗ Cancel

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; </div>

)}

```



---



\### \*\*Import Handler\*\*



```javascript

const handleConfirmImport = async () => {

&nbsp; try {

&nbsp;   setLoading(true);

&nbsp;   

&nbsp;   // Parse CSV again to get validated rows

&nbsp;   const text = await csvFile.text();

&nbsp;   const lines = text.split('\\n').filter(line => line.trim());

&nbsp;   const hasHeader = lines\[0].toLowerCase().includes('band');

&nbsp;   const dataLines = hasHeader ? lines.slice(1) : lines;

&nbsp;   

&nbsp;   const locations = await db.locations.toArray();

&nbsp;   const performancesToAdd = \[];

&nbsp;   

&nbsp;   dataLines.forEach(line => {

&nbsp;     if (!line.trim()) return;

&nbsp;     

&nbsp;     const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

&nbsp;     if (parts.length !== 4) return;

&nbsp;     

&nbsp;     const \[bandName, stageName, dateStr, timeStr] = parts;

&nbsp;     

&nbsp;     // Convert date DD-MM-YYYY → YYYY-MM-DD

&nbsp;     const \[day, month, year] = dateStr.split('-');

&nbsp;     const dateFormatted = `${year}-${month}-${day}`;

&nbsp;     

&nbsp;     // Find location ID

&nbsp;     const location = locations.find(loc => 

&nbsp;       loc.name.toLowerCase() === stageName.toLowerCase()

&nbsp;     );

&nbsp;     

&nbsp;     if (location) {

&nbsp;       performancesToAdd.push({

&nbsp;         band\_id: bandName.trim(),

&nbsp;         location\_id: location.id,

&nbsp;         date: dateFormatted,

&nbsp;         time: timeStr

&nbsp;       });

&nbsp;     }

&nbsp;   });

&nbsp;   

&nbsp;   // Delete all existing performances

&nbsp;   const existingPerfs = await db.performances.toArray();

&nbsp;   for (const perf of existingPerfs) {

&nbsp;     await db.performances.delete(perf.id);

&nbsp;   }

&nbsp;   

&nbsp;   // Add new performances

&nbsp;   for (const perf of performancesToAdd) {

&nbsp;     await db.performances.add(perf);

&nbsp;   }

&nbsp;   

&nbsp;   setMessage(`✓ Schedule imported: ${performancesToAdd.length} performances added`);

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   

&nbsp;   // Close modal and refresh

&nbsp;   setShowUploadModal(false);

&nbsp;   setCsvFile(null);

&nbsp;   setCsvPreview(null);

&nbsp;   loadSchedule();

&nbsp;   setLoading(false);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Import error:', error);

&nbsp;   setMessage('❌ Error importing schedule: ' + error.message);

&nbsp;   setLoading(false);

&nbsp; }

};



const handleCancelImport = () => {

&nbsp; setShowUploadModal(false);

&nbsp; setCsvFile(null);

&nbsp; setCsvPreview(null);

};

```



---



\## \*\*🧪 TESTING CHECKLIST\*\*



\### \*\*CSV Upload Tests\*\*



\- \[ ] Upload valid CSV with header row

\- \[ ] Upload valid CSV without header row

\- \[ ] Upload CSV with 1 performance

\- \[ ] Upload CSV with 50+ performances

\- \[ ] Upload CSV with invalid file extension (.txt)

\- \[ ] Upload CSV with missing columns

\- \[ ] Upload CSV with extra columns

\- \[ ] Upload CSV with non-existent stage name

\- \[ ] Upload CSV with invalid date format

\- \[ ] Upload CSV with invalid time format

\- \[ ] Upload CSV with empty band name

\- \[ ] Upload CSV with special characters in band name

\- \[ ] Upload CSV with quoted values containing commas

\- \[ ] Cancel import in preview modal

\- \[ ] Confirm import and verify old schedule deleted



---



\### \*\*Display Tests\*\*



\- \[ ] Empty schedule shows correct empty state

\- \[ ] Current day auto-expands on load

\- \[ ] Non-current day loads collapsed

\- \[ ] Day header shows correct count

\- \[ ] Stage header shows correct count

\- \[ ] Click day header toggles expand/collapse

\- \[ ] Click stage header toggles expand/collapse

\- \[ ] Performances sorted by time within stage

\- \[ ] Days sorted chronologically

\- \[ ] Time format toggle works (24hr ↔ 12hr)

\- \[ ] Band filter shows all performances for selected band

\- \[ ] Band filter clears correctly

\- \[ ] Upload button only visible to admin/owner

\- \[ ] Upload button hidden from regular users



---



\### \*\*Edge Cases\*\*



\- \[ ] Same band performing multiple times same day

\- \[ ] Same band performing at multiple stages

\- \[ ] Performances spanning multiple days

\- \[ ] Single-day festival

\- \[ ] Multi-week festival

\- \[ ] Performance at midnight (00:00)

\- \[ ] Performance at 23:59

\- \[ ] Very long band names

\- \[ ] Very long stage names

\- \[ ] Special characters in band/stage names



---



\## \*\*📝 IMPLEMENTATION SUMMARY\*\*



\### \*\*What Needs to Change\*\*



1\. \*\*Remove Manual Editing:\*\*

&nbsp;  - Delete: Add performance form

&nbsp;  - Delete: Edit performance functionality

&nbsp;  - Delete: Delete performance buttons

&nbsp;  - Keep: View-only display



2\. \*\*Add CSV Upload:\*\*

&nbsp;  - Upload button (admin only)

&nbsp;  - File picker

&nbsp;  - Parser with validation

&nbsp;  - Preview modal

&nbsp;  - Import handler



3\. \*\*Change Grouping:\*\*

&nbsp;  - From: Group by Band

&nbsp;  - To: Group by Day → Stage



4\. \*\*Add Features:\*\*

&nbsp;  - Time format toggle

&nbsp;  - Band filter dropdown

&nbsp;  - Auto-expand current day

&nbsp;  - Empty state handling



5\. \*\*Update Styling:\*\*

&nbsp;  - Match dark theme

&nbsp;  - Three-level collapsible UI

&nbsp;  - Clean, scannable layout



---



\## \*\*🎯 READY FOR CLAUDE CODE\*\*



This specification should give Claude Code everything needed to implement the new Schedule page. 



\*\*Recommended approach:\*\*

1\. Paste entire specification

2\. Ask Claude Code to confirm understanding

3\. Request implementation in phases:

&nbsp;  - Phase 1: UI structure \& display

&nbsp;  - Phase 2: CSV upload

&nbsp;  - Phase 3: Testing \& refinement



---





