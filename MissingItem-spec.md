\## \*\*🚨 MISSING ITEM ALERT - FINAL SPECIFICATION\*\*



Perfect! Simple is better. Two states only: \*\*Active\*\* and \*\*Missing\*\*.



---



\## \*\*🎯 OVERVIEW\*\*



Add ability to mark gear items as "missing" when they can't be found. Display prominent alerts to all users so anyone who spots the item can update its location. Any location update automatically resolves the missing status.



---



\## \*\*🗄️ DATABASE CHANGES\*\*



\### \*\*Update `festivals/{festivalId}/gear` documents:\*\*



\*\*CURRENT:\*\*

```javascript

{

&nbsp; id: "gear\_abc123",

&nbsp; band\_id: "The Rockers",

&nbsp; description: "Guitar",

&nbsp; qr\_code: "data:image...",

&nbsp; current\_location\_id: 2,

&nbsp; status: "active",

&nbsp; in\_transit: false,

&nbsp; checked\_out: false,

&nbsp; created\_at: timestamp,

&nbsp; lastUpdated: timestamp,

&nbsp; display\_id: 42

}

```



\*\*ADD these fields:\*\*

```javascript

{

&nbsp; // ... all existing fields ...

&nbsp; 

&nbsp; // NEW FIELDS:

&nbsp; missing\_status: "active" | "missing",       // Default: "active"

&nbsp; missing\_since: timestamp | null,            // When marked missing

&nbsp; missing\_reported\_by: "user@email.com" | null, // Who reported it

&nbsp; missing\_last\_location: 2 | null             // Location ID when marked missing

}

```



---



\## \*\*📋 STATUS FLOW\*\*



```

┌─────────┐

│ ACTIVE  │ ←─────────────────────┐

└────┬────┘                        │

&nbsp;    │                             │

&nbsp;    │ \[Report Missing]            │

&nbsp;    ↓                             │

┌─────────┐                        │

│ MISSING │                        │

└─────────┘                        │

&nbsp;    │                             │

&nbsp;    │ \[I Found It]                │

&nbsp;    │ \[Location Changed]          │

&nbsp;    │ \[QR Scanned \& Checked In]   │

&nbsp;    └─────────────────────────────┘

```



\*\*Simple Rule:\*\* Any location update = automatically back to "active"



---



\## \*\*🎨 UI DESIGN\*\*



\### \*\*1. HOME PAGE - Alert Banner\*\*



\*\*When items are missing:\*\*

```

┌─────────────────────────────────────────┐

│ Festival Gear Tracker                   │

│ Organising Chaos Like a Pro            │

├─────────────────────────────────────────┤

│ Active: 18  Transit: 3  Checked Out: 3 │

├─────────────────────────────────────────┤

│                                         │

│ 🚨 2 ITEMS MISSING                     │

│ Guitar (#0042) • Keyboard (#0089)      │

│ \[View Missing Items →]                  │

│                                         │

├─────────────────────────────────────────┤

│ \[Scan QR]    \[Register]                │

│ \[Gear List]  \[Schedule]                │

└─────────────────────────────────────────┘

```



\*\*Styling:\*\*

\- Background: `rgba(244, 67, 54, 0.2)`

\- Border: `2px solid #f44336`

\- Pulsing animation (like transit badges)

\- Clicking anywhere on banner → jumps to Gear List with missing filter active



\*\*When NO items missing:\*\*

\- Banner doesn't appear at all

\- Clean home screen



---



\### \*\*2. GEAR LIST - Alert Banner\*\*



\*\*At top of Gear List page (above filters):\*\*

```

┌─────────────────────────────────────────┐

│ 🚨 2 ITEMS MISSING - Click to filter   │

└─────────────────────────────────────────┘

```



\*\*Click banner:\*\*

\- Activates status filter

\- Shows only missing items

\- Scrolls to missing items section



---



\### \*\*3. GEAR LIST - Status Filter\*\*



\*\*Update existing filter buttons:\*\*

```

\[All] \[Band] \[Location] \[Status]

```



\*\*When Status clicked, show options:\*\*

```

\[Active] \[Missing] \[In Transit] \[Checked Out]

```



\*\*When "Missing" selected:\*\*

\- Shows only items with `missing\_status: "missing"`

\- Can still group by band (collapsed/expanded)



---



\### \*\*4. GEAR LIST - Missing Item Display\*\*



\*\*In band groups, missing items show special badge:\*\*

```

▼ The Rockers (3 items)

&nbsp; 

&nbsp; ⚠️ Guitar

&nbsp;    #0042 • Missing for 2h

&nbsp;    Last seen: Salty Dog Stage

&nbsp;    \[MISSING ⚠️] ← Badge (orange, pulsing)

&nbsp; 

&nbsp; ✓ Bass

&nbsp;    #0043 • 1h ago

&nbsp;    \[SALTY DOG] ← Normal green badge

```



\*\*Missing badge styling:\*\*

```javascript

{

&nbsp; text: "MISSING ⚠️",

&nbsp; color: "#ff9800",

&nbsp; bg: "rgba(255, 152, 0, 0.2)",

&nbsp; border: "#f57c00",

&nbsp; pulse: true,

&nbsp; boxShadow: "0 0 12px rgba(255, 152, 0, 0.5)"

}

```



---



\### \*\*5. ITEM DETAIL VIEW - Missing Actions\*\*



\*\*When item is ACTIVE (normal):\*\*

```

┌─────────────────────────────────────────┐

│ Item Details                            │

├─────────────────────────────────────────┤

│ Band: The Rockers                       │

│ Description: Guitar                     │

│ Item ID: #0042                          │

│ Status: AT SALTY DOG                    │

│ Last Updated: 2h ago                    │

│                                         │

│ \[Change Location...]                    │

│ \[Select] \[Edit] \[Print] \[History]      │

│ {isAdminOrOwner \&\& <Delete>}           │

│                                         │

│ \[⚠️ Report Missing]  ← NEW BUTTON      │

│                                         │

│ \[Close]                                 │

└─────────────────────────────────────────┘

```



\*\*When item is MISSING:\*\*

```

┌─────────────────────────────────────────┐

│ Item Details                            │

├─────────────────────────────────────────┤

│ Band: The Rockers                       │

│ Description: Guitar                     │

│ Item ID: #0042                          │

│ Status: ⚠️ MISSING                      │

│                                         │

│ Missing for: 2h 15m                     │

│ Last seen: Salty Dog Stage | 2h ago    │

│ Reported by: john@festival.com          │

│                                         │

│ \[✓ I Found It - Select Location]       │

│                                         │

│ \[Select] \[Edit] \[Print] \[History]      │

│ {isAdminOrOwner \&\& <Delete>}           │

│ \[Close]                                 │

└─────────────────────────────────────────┘

```



---



\## \*\*🔧 FUNCTIONALITY IMPLEMENTATION\*\*



\### \*\*1. Report Missing\*\*



\*\*Trigger:\*\* User clicks "⚠️ Report Missing" button



\*\*Confirmation dialog:\*\*

```

Are you sure this item is missing?



This will alert all users to help find it.



\[Yes, Report Missing] \[Cancel]

```



\*\*On confirm:\*\*

```javascript

await db.gear.update(itemId, {

&nbsp; missing\_status: "missing",

&nbsp; missing\_since: new Date(),

&nbsp; missing\_reported\_by: currentUser.email,

&nbsp; missing\_last\_location: item.current\_location\_id,

&nbsp; lastUpdated: new Date()

});



// Add to scan history

await db.scans.add({

&nbsp; gear\_id: itemId,

&nbsp; location\_id: item.current\_location\_id,

&nbsp; timestamp: new Date(),

&nbsp; action: "reported\_missing",

&nbsp; user\_email: currentUser.email,

&nbsp; synced: false

});

```



\*\*UI feedback:\*\*

```

✓ Guitar marked as missing

Alert sent to all users



\[OK]

```



\*\*Result:\*\*

\- Close item detail

\- Refresh gear list

\- Missing alert appears on home page

\- Missing count updates



---



\### \*\*2. I Found It\*\*



\*\*Trigger:\*\* User clicks "✓ I Found It" button



\*\*Flow:\*\*



\*\*Step 1 - Show location picker:\*\*

```

Where did you find it?



\[Salty Dog Stage]

\[Providencia Stage]

\[Trailer Park]

\[Survivor]



\[Cancel]

```



\*\*Step 2 - On location selected:\*\*

```javascript

await db.gear.update(itemId, {

&nbsp; current\_location\_id: selectedLocationId,

&nbsp; missing\_status: "active",           // Auto-resolve

&nbsp; missing\_since: null,                // Clear

&nbsp; missing\_reported\_by: null,          // Clear

&nbsp; missing\_last\_location: null,        // Clear

&nbsp; in\_transit: false,

&nbsp; checked\_out: false,

&nbsp; lastUpdated: new Date()

});



await db.scans.add({

&nbsp; gear\_id: itemId,

&nbsp; location\_id: selectedLocationId,

&nbsp; timestamp: new Date(),

&nbsp; action: "found\_missing\_item",

&nbsp; user\_email: currentUser.email,

&nbsp; synced: false

});

```



\*\*UI feedback:\*\*

```

✓ Guitar found!

Checked in to Salty Dog Stage



\[OK]

```



\*\*Result:\*\*

\- Close item detail

\- Refresh gear list

\- Missing alert updates (count decreases)

\- Item shows normal green badge



---



\### \*\*3. Auto-Resolve on Location Change\*\*



\*\*Trigger:\*\* ANY action that changes location



\*\*These actions auto-resolve missing status:\*\*

1\. Scan QR code → select location

2\. Manual "Change Location" in item detail

3\. Bulk location change from gear list



\*\*Implementation:\*\*

```javascript

// In any function that updates location:

const updateItemLocation = async (itemId, newLocationId) => {

&nbsp; const item = await db.gear.get(itemId);

&nbsp; 

&nbsp; const updates = {

&nbsp;   current\_location\_id: newLocationId,

&nbsp;   in\_transit: false,

&nbsp;   checked\_out: false,

&nbsp;   lastUpdated: new Date()

&nbsp; };

&nbsp; 

&nbsp; // Auto-resolve if missing

&nbsp; if (item.missing\_status === "missing") {

&nbsp;   updates.missing\_status = "active";

&nbsp;   updates.missing\_since = null;

&nbsp;   updates.missing\_reported\_by = null;

&nbsp;   updates.missing\_last\_location = null;

&nbsp;   

&nbsp;   // Special scan history entry

&nbsp;   await db.scans.add({

&nbsp;     gear\_id: itemId,

&nbsp;     location\_id: newLocationId,

&nbsp;     timestamp: new Date(),

&nbsp;     action: "missing\_item\_recovered",

&nbsp;     user\_email: currentUser.email,

&nbsp;     synced: false

&nbsp;   });

&nbsp;   

&nbsp;   // Show special message

&nbsp;   setMessage(`✓ Missing item found! ${item.description} checked in to ${getLocationName(newLocationId)}`);

&nbsp; }

&nbsp; 

&nbsp; await db.gear.update(itemId, updates);

};

```



---



\## \*\*📊 MISSING ITEMS COUNTER\*\*



\### \*\*Calculate Missing Count\*\*



\*\*In App.jsx (where status counts are calculated):\*\*



```javascript

const loadStatusCounts = useCallback(async () => {

&nbsp; if (!db) return;

&nbsp; try {

&nbsp;   const allGear = await db.gear.toArray();

&nbsp;   

&nbsp;   const active = allGear.filter(g => 

&nbsp;     !g.in\_transit \&\& 

&nbsp;     !g.checked\_out \&\& 

&nbsp;     g.current\_location\_id \&\&

&nbsp;     g.missing\_status !== "missing"  // ← Exclude missing from active

&nbsp;   ).length;

&nbsp;   

&nbsp;   const transit = allGear.filter(g => g.in\_transit).length;

&nbsp;   const checkedOut = allGear.filter(g => g.checked\_out).length;

&nbsp;   const missing = allGear.filter(g => g.missing\_status === "missing").length; // ← NEW

&nbsp;   

&nbsp;   setStatusCounts({ active, transit, checkedOut, missing });

&nbsp; } catch (error) {

&nbsp;   console.error('Error loading status counts:', error);

&nbsp; }

}, \[db]);

```



---



\### \*\*Display Missing Count\*\*



\*\*Option A - Add to existing info bar:\*\*

```

┌─────────────────────────────────────────┐

│ Active: 18 | Transit: 3 | Out: 3 | ⚠️ 2 │

└─────────────────────────────────────────┘

```



\*\*Option B - Separate alert (if missing > 0):\*\*

```

┌─────────────────────────────────────────┐

│ Active: 18  Transit: 3  Checked Out: 3 │

├─────────────────────────────────────────┤

│ 🚨 2 ITEMS MISSING                     │

│ Guitar (#0042) • Keyboard (#0089)      │

└─────────────────────────────────────────┘

```



\*\*My Recommendation:\*\* Option B (separate alert) - more prominent



---



\## \*\*🎨 STYLING SPECIFICATION\*\*



\### \*\*Missing Alert Banner\*\*



```javascript

const styles = {

&nbsp; missingAlertBanner: {

&nbsp;   padding: '16px',

&nbsp;   marginBottom: '16px',

&nbsp;   background: 'rgba(244, 67, 54, 0.2)',

&nbsp;   border: '2px solid #f44336',

&nbsp;   borderLeft: '4px solid #f44336',

&nbsp;   borderRadius: '6px',

&nbsp;   cursor: 'pointer',

&nbsp;   animation: 'pulse 2s ease-in-out infinite',

&nbsp;   transition: 'all 0.2s'

&nbsp; },

&nbsp; 

&nbsp; missingAlertTitle: {

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ff6b6b',

&nbsp;   marginBottom: '8px',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; missingAlertItems: {

&nbsp;   fontSize: '13px',

&nbsp;   color: '#ccc',

&nbsp;   marginBottom: '8px'

&nbsp; },

&nbsp; 

&nbsp; missingAlertAction: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '600',

&nbsp;   textDecoration: 'underline'

&nbsp; },

&nbsp; 

&nbsp; // Missing item badge (in gear list)

&nbsp; missingBadge: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: 'rgba(255, 152, 0, 0.2)',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.8px',

&nbsp;   minWidth: '120px',

&nbsp;   textAlign: 'center',

&nbsp;   color: '#ff9800',

&nbsp;   borderLeft: '4px solid #f57c00',

&nbsp;   paddingLeft: '8px',

&nbsp;   animation: 'pulse 2s ease-in-out infinite',

&nbsp;   boxShadow: '0 0 12px rgba(255, 152, 0, 0.5)'

&nbsp; },

&nbsp; 

&nbsp; // Report Missing button

&nbsp; reportMissingBtn: {

&nbsp;   width: '100%',

&nbsp;   padding: '16px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ff9800',

&nbsp;   border: '2px solid #ff9800',

&nbsp;   borderRadius: '6px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   marginTop: '20px'

&nbsp; },

&nbsp; 

&nbsp; // I Found It button

&nbsp; foundItBtn: {

&nbsp;   width: '100%',

&nbsp;   padding: '16px',

&nbsp;   background: '#4caf50',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; }

};

```



---



\## \*\*📝 COMPONENT UPDATES NEEDED\*\*



\### \*\*1. App.jsx\*\*



\*\*Add missing count to state:\*\*

```javascript

const \[statusCounts, setStatusCounts] = useState({ 

&nbsp; active: 0, 

&nbsp; transit: 0, 

&nbsp; checkedOut: 0,

&nbsp; missing: 0  // ← NEW

});

```



\*\*Update loadStatusCounts function\*\* (see above)



\*\*Add missing alert banner:\*\*

```javascript

{statusCounts.missing > 0 \&\& (

&nbsp; <div 

&nbsp;   style={styles.missingAlertBanner}

&nbsp;   onClick={() => {

&nbsp;     setActiveTab('gear');

&nbsp;     // TODO: Also activate missing filter in GearList

&nbsp;   }}

&nbsp; >

&nbsp;   <div style={styles.missingAlertTitle}>

&nbsp;     🚨 {statusCounts.missing} {statusCounts.missing === 1 ? 'ITEM' : 'ITEMS'} MISSING

&nbsp;   </div>

&nbsp;   <div style={styles.missingAlertItems}>

&nbsp;     Click to view missing items

&nbsp;   </div>

&nbsp; </div>

)}

```



---



\### \*\*2. GearList.jsx\*\*



\*\*Add missing alert banner at top:\*\*

```javascript

{/\* At top of component, before filters \*/}

{missingCount > 0 \&\& (

&nbsp; <div 

&nbsp;   style={styles.missingAlert}

&nbsp;   onClick={() => {

&nbsp;     setFilterType('status');

&nbsp;     setFilterValue('missing');

&nbsp;   }}

&nbsp; >

&nbsp;   🚨 {missingCount} ITEMS MISSING - Click to filter

&nbsp; </div>

)}

```



\*\*Add "Missing" to status filter options:\*\*

```javascript

{filterType === 'status' \&\& (

&nbsp; <select

&nbsp;   value={filterValue}

&nbsp;   onChange={(e) => setFilterValue(e.target.value)}

&nbsp;   style={styles.select}

&nbsp; >

&nbsp;   <option value="">Select status...</option>

&nbsp;   <option value="active">Active (At Location)</option>

&nbsp;   <option value="missing">Missing ⚠️</option>  {/\* ← NEW \*/}

&nbsp;   <option value="in-transit">In Transit</option>

&nbsp;   <option value="checked-out">Checked Out</option>

&nbsp; </select>

)}

```



\*\*Update getFilteredItems function:\*\*

```javascript

const getFilteredItems = useCallback(() => {

&nbsp; let filtered = \[...gearItems];



&nbsp; if (filterType === 'band' \&\& filterValue) {

&nbsp;   filtered = filtered.filter(item => item.band\_id === filterValue);

&nbsp; } else if (filterType === 'location' \&\& filterValue) {

&nbsp;   filtered = filtered.filter(item => item.current\_location\_id === parseInt(filterValue));

&nbsp; } else if (filterType === 'status' \&\& filterValue) {

&nbsp;   if (filterValue === 'active') {

&nbsp;     filtered = filtered.filter(item => 

&nbsp;       !item.in\_transit \&\& 

&nbsp;       !item.checked\_out \&\& 

&nbsp;       item.current\_location\_id \&\&

&nbsp;       item.missing\_status !== "missing"  // ← Exclude missing

&nbsp;     );

&nbsp;   } else if (filterValue === 'missing') {  // ← NEW

&nbsp;     filtered = filtered.filter(item => item.missing\_status === "missing");

&nbsp;   } else if (filterValue === 'in-transit') {

&nbsp;     filtered = filtered.filter(item => item.in\_transit);

&nbsp;   } else if (filterValue === 'checked-out') {

&nbsp;     filtered = filtered.filter(item => item.checked\_out);

&nbsp;   }

&nbsp; }



&nbsp; return filtered;

}, \[gearItems, filterType, filterValue]);

```



\*\*Update getStatusBadge function:\*\*

```javascript

const getStatusBadge = (item) => {

&nbsp; // Priority order: Missing > Transit > Checked Out > Active

&nbsp; 

&nbsp; if (item.missing\_status === "missing") {  // ← NEW - Check first

&nbsp;   return { 

&nbsp;     text: 'MISSING ⚠️', 

&nbsp;     color: '#ff9800', 

&nbsp;     bg: 'rgba(255, 152, 0, 0.2)', 

&nbsp;     border: '#f57c00', 

&nbsp;     pulse: true 

&nbsp;   };

&nbsp; } else if (item.in\_transit) {

&nbsp;   return { 

&nbsp;     text: 'IN TRANSIT', 

&nbsp;     color: '#ff6b6b', 

&nbsp;     bg: 'rgba(244, 67, 54, 0.2)', 

&nbsp;     border: '#f44336', 

&nbsp;     pulse: true 

&nbsp;   };

&nbsp; } else if (item.checked\_out) {

&nbsp;   return { 

&nbsp;     text: 'CHECKED OUT', 

&nbsp;     color: '#888', 

&nbsp;     bg: 'rgba(120, 120, 120, 0.15)', 

&nbsp;     border: '#666', 

&nbsp;     pulse: false 

&nbsp;   };

&nbsp; } else if (item.current\_location\_id) {

&nbsp;   const loc = getLocationInfo(item.current\_location\_id);

&nbsp;   return { 

&nbsp;     text: loc.name.toUpperCase(), 

&nbsp;     color: '#4caf50', 

&nbsp;     bg: 'rgba(76, 175, 80, 0.15)', 

&nbsp;     border: '#4caf50', 

&nbsp;     pulse: false 

&nbsp;   };

&nbsp; } else {

&nbsp;   return { 

&nbsp;     text: 'NO LOCATION', 

&nbsp;     color: '#888', 

&nbsp;     bg: 'rgba(120, 120, 120, 0.15)', 

&nbsp;     border: '#666', 

&nbsp;     pulse: false 

&nbsp;   };

&nbsp; }

};

```



\*\*Add buttons to item detail view:\*\*

```javascript

{selectedItemDetail \&\& (

&nbsp; <div style={styles.detailOverlay}>

&nbsp;   <div style={styles.detailCard}>

&nbsp;     <h2>Item Details</h2>

&nbsp;     

&nbsp;     {/\* ... existing info ... \*/}

&nbsp;     

&nbsp;     {/\* Missing info if applicable \*/}

&nbsp;     {selectedItemDetail.missing\_status === "missing" \&\& (

&nbsp;       <div style={styles.missingInfo}>

&nbsp;         <div style={styles.detailLabel}>Missing Since</div>

&nbsp;         <div style={styles.detailValue}>

&nbsp;           {getTimeAgo(selectedItemDetail.missing\_since)}

&nbsp;         </div>

&nbsp;         

&nbsp;         <div style={styles.detailLabel}>Last Seen</div>

&nbsp;         <div style={styles.detailValue}>

&nbsp;           {getLocationInfo(selectedItemDetail.missing\_last\_location).name}

&nbsp;         </div>

&nbsp;         

&nbsp;         <div style={styles.detailLabel}>Reported By</div>

&nbsp;         <div style={styles.detailValue}>

&nbsp;           {selectedItemDetail.missing\_reported\_by}

&nbsp;         </div>

&nbsp;       </div>

&nbsp;     )}

&nbsp;     

&nbsp;     {/\* Action buttons \*/}

&nbsp;     <div style={styles.detailButtons}>

&nbsp;       {selectedItemDetail.missing\_status === "missing" ? (

&nbsp;         <button onClick={() => handleFoundIt(selectedItemDetail)} style={styles.foundItBtn}>

&nbsp;           ✓ I Found It - Select Location

&nbsp;         </button>

&nbsp;       ) : (

&nbsp;         <>

&nbsp;           {/\* ... existing buttons (Edit, Print, etc) ... \*/}

&nbsp;           

&nbsp;           <button onClick={() => handleReportMissing(selectedItemDetail)} style={styles.reportMissingBtn}>

&nbsp;             ⚠️ Report Missing

&nbsp;           </button>

&nbsp;         </>

&nbsp;       )}

&nbsp;       

&nbsp;       {/\* ... other buttons ... \*/}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; </div>

)}

```



\*\*Add handler functions:\*\*

```javascript

const handleReportMissing = async (item) => {

&nbsp; const confirmed = window.confirm(

&nbsp;   `Are you sure ${item.description} is missing?\\n\\nThis will alert all users to help find it.`

&nbsp; );

&nbsp; 

&nbsp; if (!confirmed) return;

&nbsp; 

&nbsp; try {

&nbsp;   await db.gear.update(item.id, {

&nbsp;     missing\_status: "missing",

&nbsp;     missing\_since: new Date(),

&nbsp;     missing\_reported\_by: currentUser?.email || 'Unknown',

&nbsp;     missing\_last\_location: item.current\_location\_id,

&nbsp;     lastUpdated: new Date()

&nbsp;   });

&nbsp;   

&nbsp;   await db.scans.add({

&nbsp;     gear\_id: item.id,

&nbsp;     location\_id: item.current\_location\_id,

&nbsp;     timestamp: new Date(),

&nbsp;     action: "reported\_missing",

&nbsp;     user\_email: currentUser?.email || 'Unknown',

&nbsp;     synced: false

&nbsp;   });

&nbsp;   

&nbsp;   setMessage(`✓ ${item.description} marked as missing. Alert sent to all users.`);

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   

&nbsp;   setSelectedItemDetail(null);

&nbsp;   loadData();

&nbsp; } catch (error) {

&nbsp;   console.error('Error reporting missing:', error);

&nbsp;   alert('Error reporting item as missing');

&nbsp; }

};



const handleFoundIt = async (item) => {

&nbsp; // Show location picker

&nbsp; const locationId = await showLocationPicker(); // You'll need to implement this

&nbsp; 

&nbsp; if (!locationId) return;

&nbsp; 

&nbsp; try {

&nbsp;   await db.gear.update(item.id, {

&nbsp;     current\_location\_id: locationId,

&nbsp;     missing\_status: "active",

&nbsp;     missing\_since: null,

&nbsp;     missing\_reported\_by: null,

&nbsp;     missing\_last\_location: null,

&nbsp;     in\_transit: false,

&nbsp;     checked\_out: false,

&nbsp;     lastUpdated: new Date()

&nbsp;   });

&nbsp;   

&nbsp;   await db.scans.add({

&nbsp;     gear\_id: item.id,

&nbsp;     location\_id: locationId,

&nbsp;     timestamp: new Date(),

&nbsp;     action: "found\_missing\_item",

&nbsp;     user\_email: currentUser?.email || 'Unknown',

&nbsp;     synced: false

&nbsp;   });

&nbsp;   

&nbsp;   const locationName = getLocationInfo(locationId).name;

&nbsp;   setMessage(`✓ ${item.description} found! Checked in to ${locationName}`);

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   

&nbsp;   setSelectedItemDetail(null);

&nbsp;   loadData();

&nbsp; } catch (error) {

&nbsp;   console.error('Error marking found:', error);

&nbsp;   alert('Error marking item as found');

&nbsp; }

};

```



---



\### \*\*3. Scanner.jsx \& Location Update Functions\*\*



\*\*Update ANY function that changes item location:\*\*



```javascript

// Example in Scanner flow or manual location change:

const handleLocationSelect = async (locationId) => {

&nbsp; if (!scannedGear) return;



&nbsp; try {

&nbsp;   const updateData = {

&nbsp;     current\_location\_id: locationId,

&nbsp;     in\_transit: false,

&nbsp;     checked\_out: false,

&nbsp;     lastUpdated: new Date()

&nbsp;   };

&nbsp;   

&nbsp;   // Auto-resolve if missing

&nbsp;   if (scannedGear.missing\_status === "missing") {

&nbsp;     updateData.missing\_status = "active";

&nbsp;     updateData.missing\_since = null;

&nbsp;     updateData.missing\_reported\_by = null;

&nbsp;     updateData.missing\_last\_location = null;

&nbsp;     

&nbsp;     await db.scans.add({

&nbsp;       gear\_id: scannedGear.id,

&nbsp;       location\_id: locationId,

&nbsp;       timestamp: new Date(),

&nbsp;       action: "missing\_item\_recovered",

&nbsp;       user\_email: currentUser?.email || 'Unknown',

&nbsp;       synced: false

&nbsp;     });

&nbsp;     

&nbsp;     setMessage(`✓ Missing item found! ${scannedGear.description} checked in`);

&nbsp;   } else {

&nbsp;     setMessage('✓ Item checked in successfully');

&nbsp;   }



&nbsp;   await db.gear.update(scannedGear.id, updateData);

&nbsp;   

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   setScannedGear(null);

&nbsp;   setActiveTab('home');

&nbsp;   setRefreshTrigger(prev => prev + 1);

&nbsp; } catch (error) {

&nbsp;   console.error('Error updating gear:', error);

&nbsp;   setMessage('Error checking in item');

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp; }

};

```



---



\## \*\*🧪 TESTING CHECKLIST\*\*



\### \*\*Basic Functionality\*\*

\- \[ ] Mark active item as missing

\- \[ ] Missing alert appears on home page

\- \[ ] Missing alert appears on gear list

\- \[ ] Missing count updates correctly

\- \[ ] Click alert on home → jumps to gear list

\- \[ ] Click alert on gear list → activates missing filter

\- \[ ] Missing items show orange pulsing badge

\- \[ ] Click "I Found It" → location picker appears

\- \[ ] Select location → item marked as active

\- \[ ] Alert disappears when all items found

\- \[ ] Multiple missing items display correctly



\### \*\*Auto-Resolve\*\*

\- \[ ] Scan missing item QR → auto-marks as active

\- \[ ] Manual location change → auto-marks as active

\- \[ ] Bulk location change → auto-marks as active

\- \[ ] Special message shows when missing item recovered



\### \*\*Scan History\*\*

\- \[ ] "reported\_missing" action logged

\- \[ ] "found\_missing\_item" action logged

\- \[ ] "missing\_item\_recovered" action logged (auto-resolve)

\- \[ ] User email captured correctly

\- \[ ] Timestamps accurate



\### \*\*Permissions\*\*

\- \[ ] All users can report missing

\- \[ ] All users can mark as found

\- \[ ] Delete button still respects admin-only rule



\### \*\*Edge Cases\*\*

\- \[ ] Report already missing item (should not duplicate)

\- \[ ] Report item that's in transit

\- \[ ] Report item that's checked out

\- \[ ] Missing item with no last location

\- \[ ] Very long time missing (days)

\- \[ ] Multiple users reporting same item

\- \[ ] Missing item deleted (alert should update)



\### \*\*UI/UX\*\*

\- \[ ] Alert banner is prominent but not annoying

\- \[ ] Pulse animation works smoothly

\- \[ ] Missing badge clearly visible

\- \[ ] Item detail shows missing info clearly

\- \[ ] Confirmation dialogs are clear

\- \[ ] Success messages display correctly

\- \[ ] Mobile responsive



---



\## \*\*📝 SUMMARY FOR CLAUDE CODE\*\*



\*\*What to implement:\*\*



1\. \*\*Database:\*\* Add 4 new fields to gear documents (missing\_status, missing\_since, missing\_reported\_by, missing\_last\_location)



2\. \*\*App.jsx:\*\* 

&nbsp;  - Add missing count to status counts

&nbsp;  - Display missing alert banner when count > 0

&nbsp;  - Click banner navigates to gear list



3\. \*\*GearList.jsx:\*\*

&nbsp;  - Add missing alert banner at top

&nbsp;  - Add "Missing" to status filter

&nbsp;  - Update badge display logic (missing badge priority)

&nbsp;  - Add "Report Missing" button to item detail (when active)

&nbsp;  - Add "I Found It" button to item detail (when missing)

&nbsp;  - Show missing info in item detail

&nbsp;  - Implement handleReportMissing function

&nbsp;  - Implement handleFoundIt function



4\. \*\*All location update functions:\*\*

&nbsp;  - Check if item.missing\_status === "missing"

&nbsp;  - If yes, auto-set to "active" and clear missing fields

&nbsp;  - Log special scan history entry

&nbsp;  - Show special success message



5\. \*\*Styling:\*\*

&nbsp;  - Missing alert banner (red, pulsing)

&nbsp;  - Missing badge (orange, pulsing)

&nbsp;  - Report Missing button (orange border)

&nbsp;  - I Found It button (green solid)



\*\*Key behaviors:\*\*

\- Simple two-state system (active/missing)

\- All users can report and resolve

\- Any location update auto-resolves missing status

\- Persistent alerts (no dismiss option)

\- Prominent display on home and gear list



---



