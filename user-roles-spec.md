TASK: Implement User Roles System

I need to implement a role-based access control system for the Festival Gear Tracker app. There are three user roles with different permission levels.

USER ROLES:



Owner - The person who created the festival (already set in FestivalSetup.jsx)



Full access to everything

Can manage users and assign roles

Cannot be removed or demoted





Admin - Appointed by Owner



Can perform all festival operations

Cannot manage users or roles

Can be promoted/demoted by Owner





User - Regular staff/volunteers



Can perform day-to-day operations

Cannot access administrative features

Can be invited by Owner/Admin









DATABASE CHANGES:



Update festivals/{festivalId} document to add:



javascript{

&nbsp; // ... existing fields ...

&nbsp; admins: \[],  // Array of user IDs with admin role

&nbsp; users: \[]    // Array of user IDs with user role

}



The users/{userId} collection already has a role field set during festival creation. No changes needed there.





PERMISSION MATRIX:

FeatureOwnerAdminUserScan QR Codes✅✅✅View Gear List✅✅✅Register Single Item✅✅✅Edit Gear Item✅✅✅Manual Location Change✅✅✅Bulk Location Change✅✅✅Bulk Checkout Operations✅✅✅Delete Gear Item✅✅❌Bulk Upload CSV✅✅❌View Schedule✅✅✅Upload Schedule CSV✅✅❌Manage Locations✅✅❌Manage Users/Roles✅❌❌



IMPLEMENTATION STEPS:

Step 1: Create useRole Hook

Create a new file /src/contexts/useRole.jsx (or add to existing context) that provides:

javascriptconst { isOwner, isAdmin, isAdminOrOwner, currentRole } = useRole();

Logic:

javascriptconst { currentUser } = useAuth();

const { currentFestival } = useFestival();



const isOwner = currentFestival?.ownerId === currentUser?.uid;

const isAdmin = currentFestival?.admins?.includes(currentUser?.uid);

const isAdminOrOwner = isOwner || isAdmin;

const currentRole = isOwner ? "owner" : isAdmin ? "admin" : "user";



Step 2: Update App.jsx Home Page

Hide these buttons from regular users (show only to Admin/Owner):



📦 Bulk Upload button

📍 Locations button



Pattern:

javascript{isAdminOrOwner \&\& (

&nbsp; <div style={styles.homeButton} onClick={() => setActiveTab('prepared')}>

&nbsp;   <span style={styles.homeButtonIcon}>📦</span>

&nbsp;   <div style={styles.homeButtonText}>Bulk Upload</div>

&nbsp; </div>

)}



{isAdminOrOwner \&\& (

&nbsp; <div style={styles.homeButton} onClick={() => setActiveTab('locations')}>

&nbsp;   <span style={styles.homeButtonIcon}>📍</span>

&nbsp;   <div style={styles.homeButtonText}>Locations</div>

&nbsp; </div>

)}



Step 3: Update GearList.jsx

IMPORTANT: Bulk operations should be accessible to ALL users. Only hide the delete button.

javascript// Keep bulk operations visible to everyone (NO role check here)

{selectedItems.length > 0 \&\& (

&nbsp; <div style={styles.bulkActions}>

&nbsp;   {/\* All bulk operation buttons accessible to everyone \*/}

&nbsp; </div>

)}



// Only hide delete button from regular users

{selectedItemDetail \&\& (

&nbsp; <div style={styles.detailOverlay}>

&nbsp;   <div style={styles.detailCard}>

&nbsp;     {/\* ... other action buttons ... \*/}

&nbsp;     

&nbsp;     {isAdminOrOwner \&\& (

&nbsp;       <button onClick={() => handleDelete(selectedItemDetail.id)} 

&nbsp;               style={{ ...styles.detailBtn, background: '#ff6b6b' }}>

&nbsp;         Delete

&nbsp;       </button>

&nbsp;     )}

&nbsp;   </div>

&nbsp; </div>

)}



Step 4: Update Schedule.jsx

Hide the "Upload Schedule" button from regular users (when we add it):

javascript{isAdminOrOwner \&\& (

&nbsp; <button onClick={handleUploadSchedule}>

&nbsp;   📤 Upload Schedule

&nbsp; </button>

)}



Step 5: Hide Entire Pages from Regular Users

For PreparedGate.jsx and LocationManager.jsx, check role at component level:

javascriptexport default function PreparedGate() {

&nbsp; const { isAdminOrOwner } = useRole();

&nbsp; 

&nbsp; if (!isAdminOrOwner) {

&nbsp;   return (

&nbsp;     <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>

&nbsp;       You don't have permission to access this page.

&nbsp;     </div>

&nbsp;   );

&nbsp; }

&nbsp; 

&nbsp; // ... rest of component

}



Step 6: Update App.jsx Routing

Prevent navigation to admin pages:

javascript{activeTab === 'prepared' \&\& isAdminOrOwner \&\& (

&nbsp; <div>

&nbsp;   <PreparedGate locationColors={locationColors} />

&nbsp;   {/\* ... back button ... \*/}

&nbsp; </div>

)}



{activeTab === 'locations' \&\& isAdminOrOwner \&\& (

&nbsp; <div>

&nbsp;   <LocationManager onUpdate={handleLocationsUpdate} />

&nbsp;   {/\* ... back button ... \*/}

&nbsp; </div>

)}

```



---



\*\*TESTING CHECKLIST:\*\*



After implementation, test with different roles:



\*\*As Owner (manually set in Firestore):\*\*

\- \[ ] See all 6 buttons on home page

\- \[ ] Can delete items in Gear List

\- \[ ] Can access Bulk Upload page

\- \[ ] Can access Location Manager

\- \[ ] Can use bulk operations



\*\*As Admin (add user UID to festival.admins array):\*\*

\- \[ ] See all 6 buttons on home page

\- \[ ] Can delete items in Gear List

\- \[ ] Can access Bulk Upload page

\- \[ ] Can access Location Manager

\- \[ ] Can use bulk operations



\*\*As User (default - not in admins array):\*\*

\- \[ ] See only 4 buttons on home page (no Bulk Upload, no Locations)

\- \[ ] Cannot see delete button in Gear List

\- \[ ] Cannot access Bulk Upload page

\- \[ ] Cannot access Location Manager

\- \[ ] CAN use bulk operations (location change, checkout)



---



\*\*NOTES:\*\*



1\. For testing, manually add user UIDs to the `admins` array in Firestore console

2\. The Owner role is already determined by `ownerId` field (set during festival creation)

3\. User Management UI is out of scope for this task - we'll add that later

4\. Focus on hiding/showing UI elements based on roles first



---



Does this implementation make sense? Please confirm understanding before starting.



---



\## \*\*OPTION 2: STEP-BY-STEP PROMPTS\*\* (If Claude Code gets confused)



If Claude Code struggles with one big prompt, break it into these smaller prompts:



---



\### \*\*Prompt 1: Create Role Hook\*\*

```

Create a useRole hook that detects user roles. 



Create /src/contexts/useRole.jsx:

\- Import useAuth and useFestival

\- Determine if user is owner (currentFestival.ownerId === currentUser.uid)

\- Determine if user is admin (currentFestival.admins?.includes(currentUser.uid))

\- Return { isOwner, isAdmin, isAdminOrOwner, currentRole }



Export this hook so other components can use it.

```



---



\### \*\*Prompt 2: Hide Home Buttons\*\*

```

Update App.jsx to hide admin buttons from regular users.



Use the useRole hook to hide these buttons:

\- Bulk Upload button (📦)

\- Locations button (📍)



Only Admin and Owner should see these buttons.

Regular users should only see: Scan QR, Register, Gear List, Schedule.

```



---



\### \*\*Prompt 3: GearList Delete Button\*\*

```

Update GearList.jsx to hide the delete button from regular users.



IMPORTANT: Keep bulk operations visible to everyone.

Only hide the delete button in the item detail view.



Use isAdminOrOwner check around the delete button only.

```



---



\### \*\*Prompt 4: Restrict Admin Pages\*\*

```

Update PreparedGate.jsx and LocationManager.jsx to show permission error to regular users.



Add a role check at the start of each component.

If user is not admin/owner, show message: "You don't have permission to access this page."

```



---



\### \*\*Prompt 5: Update Routing\*\*

```

Update App.jsx routing to prevent regular users from accessing admin pages.



Add isAdminOrOwner check to these routes:

\- activeTab === 'prepared'

\- activeTab === 'locations'



If user is not admin/owner, don't render these pages.

