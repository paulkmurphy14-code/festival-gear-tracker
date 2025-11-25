# Festival Gear Tracker - User Guide

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
   - [QR Code Scanning](#qr-code-scanning)
   - [Gear Registration](#gear-registration)
   - [Gear List Management](#gear-list-management)
   - [Location Management](#location-management)
   - [Schedule Management](#schedule-management)
   - [Stowage Planning](#stowage-planning)
   - [Team Messaging](#team-messaging)
   - [Personal Reminders](#personal-reminders)
   - [Status Dashboard](#status-dashboard)
5. [Advanced Features](#advanced-features)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Festival Gear Tracker?

Festival Gear Tracker is a comprehensive Progressive Web App (PWA) designed to manage musical equipment at festivals and events. The system enables bands, crew members, and organizers to track gear from registration through performances using QR codes, location tracking, and real-time status updates.

### Key Benefits

- **Real-time gear location tracking** with QR code scanning
- **Offline-first architecture** - works without internet connection
- **Multi-user collaboration** with role-based permissions
- **Performance scheduling** with band-gear associations
- **Visual stowage planning** for containers and trucks
- **Missing item alerts** and recovery tracking
- **Personal reminders** for gear-related tasks
- **Team messaging** and announcements

---

## User Roles & Permissions

### Role Hierarchy

#### Owner
**Who:** The person who created the festival

**Full Access:**
- All festival operations
- User management (invite, remove, change roles)
- Cannot be removed or demoted
- Can perform all Admin and User functions

#### Admin
**Who:** Appointed by Owner

**Access:**
- All gear operations (register, edit, scan, check-in/out)
- Bulk operations (CSV upload, location changes)
- Location management
- Schedule management (upload CSV, edit performances)
- Stowage planning
- Team messaging (post announcements)
- **Cannot:** Manage users or assign roles

#### User (Regular Staff/Volunteers)
**Who:** Festival volunteers and crew members

**Access:**
- Scan QR codes
- View gear list
- Register single items
- Edit gear details
- Change locations (single or bulk)
- Bulk checkout operations
- View schedule
- View messages
- Create personal reminders
- **Cannot:** Delete items, bulk CSV upload, manage locations, manage users

### Permission Matrix

| Feature | Owner | Admin | User |
|---------|-------|-------|------|
| Scan QR Codes | ✓ | ✓ | ✓ |
| View Gear List | ✓ | ✓ | ✓ |
| Register Single Item | ✓ | ✓ | ✓ |
| Edit Gear Item | ✓ | ✓ | ✓ |
| Manual Location Change | ✓ | ✓ | ✓ |
| Bulk Location Change | ✓ | ✓ | ✓ |
| Bulk Checkout Operations | ✓ | ✓ | ✓ |
| Delete Gear Item | ✓ | ✓ | ✗ |
| Bulk Upload CSV | ✓ | ✓ | ✗ |
| View Schedule | ✓ | ✓ | ✓ |
| Upload Schedule CSV | ✓ | ✓ | ✗ |
| Manage Locations | ✓ | ✓ | ✗ |
| Stowage Planning | ✓ | ✓ | ✗ |
| Post Messages | ✓ | ✓ | ✗ |
| Manage Users/Roles | ✓ | ✗ | ✗ |

---

## Getting Started

### Initial Setup (Owner)

#### Creating Your Festival

1. Sign up with email and password
2. Enter festival details:
   - Festival name
   - Registrar name
   - Location
   - Contact email and phone
   - Start and end dates
3. Click "Create Festival"
4. System automatically assigns you as Owner
5. Two default locations are created automatically:
   - **Band Registration Area** (Purple 📝)
   - **Tags Not Collected** (Red ❌)

#### Inviting Users

**Method 1: Single Invite**
1. Navigate to User Management
2. Click "Invite User"
3. Enter email address
4. Select role (Admin or User)
5. Click "Send Invitation"

**Method 2: Bulk CSV Upload**
1. Prepare CSV file with columns: `Name, Email, Role`
   ```csv
   Name,Email,Role
   John Smith,john@crew.com,admin
   Jane Doe,jane@crew.com,user
   ```
2. Click "Bulk Upload CSV"
3. Select file
4. Preview parsed users
5. Confirm import

**Method 3: Bulk Form**
1. Click "Bulk Invite Form"
2. Enter multiple users in web form
3. Submit all at once

**What happens:**
- Users receive invitation email with link
- They sign up and are automatically associated with your festival
- Their role is pre-assigned

### Joining a Festival (Admin/User)

1. Receive invitation email with link
2. Click invitation link
3. Sign up with email and password
4. System automatically associates you with the festival
5. Your role is pre-assigned by the Owner
6. You can immediately start using the app

---

## Core Features

### QR Code Scanning

#### Purpose
Quickly identify and update gear status by scanning printed QR codes attached to equipment.

#### How to Scan

1. Click "Scan QR" button on home page
2. Allow camera access when prompted (first time only)
3. Point camera at QR code on gear tag
4. System automatically identifies the item
5. Choose action:
   - **Check In:** Assign to a specific location
   - **In Transit:** Mark as moving between locations
   - **On Stage:** Mark as currently on stage
   - **Check Out to Band:** Return to band

#### Scanner Features

- Uses device's rear camera (if available)
- Works in various lighting conditions
- Prevents duplicate scans within 3 seconds
- Auto-recovery for missing items when scanned
- Shows item details after scan
- Records timestamp and user for all scans

#### Troubleshooting Scanning

**If QR code won't scan:**
- Ensure good lighting
- Hold camera steady
- Clean camera lens
- Try larger QR code print
- Use manual entry as fallback (search for item in Gear List)

---

### Gear Registration

#### Single Item Registration

**Who can do this:** All users

**Steps:**
1. Click "Register" on home page
2. Enter band name
   - Autocomplete suggestions appear from schedule and previous registrations
   - System normalizes band names to prevent duplicates
3. Add item descriptions:
   - Type manually, or
   - Use "Quick Add Instruments" modal with common items
4. Select initial location for each item (default: "Band Registration Area")
5. Click "Register Items"

**What happens:**
- System generates unique QR codes for all items
- Assigns sequential display IDs (G001, G002, etc.)
- Creates/updates band registry entry
- Links items to band's scheduled performances (if exists)
- Success screen shows registered items with "Print QR Codes" button

#### Instrument Quick-Add

Click "Quick Add Instruments" to select from common items:
- Guitar, Bass Guitar, Drum Kit
- Keyboard, Microphone, Amplifier
- Pedal Board, Synthesizer, DJ Equipment
- Mixer, Speakers, Monitor
- Custom descriptions also supported

#### Bulk CSV Upload

**Who can do this:** Owner and Admin only

**CSV Format Option 1: Basic**
```csv
Band Name, Item Description
The Rockers, Guitar
The Rockers, Drum Kit
Jazz Masters, Bass Guitar
```

**CSV Format Option 2: With Schedule**
```csv
Band Name, Item Description, Schedule Data
The Rockers, Guitar, Stage 1~08-11-2025~19:00|Stage 2~09-11-2025~21:00
Jazz Masters, Bass, Main Stage~08-11-2025~21:30
```

**Schedule format:** `Stage Name~DD-MM-YYYY~HH:MM|Stage Name~DD-MM-YYYY~HH:MM`

**Steps:**
1. Click "Bulk Upload" on home page
2. Select CSV format (Basic or With Schedule)
3. Choose file
4. Select initial location for all items
5. Preview imported items
6. Confirm import

**Features:**
- Validates band names and prevents duplicates
- Auto-creates performance records from schedule data
- Generates QR codes for all items
- Creates band registry entries
- Links performances to locations

#### Printing QR Codes

**After Registration:**
1. Success screen shows "Print QR Codes" button
2. Choose layout:
   - **Small tags:** Multiple per sheet for label printers
   - **Large sheet:** One per page for maximum visibility
   - **Sticker labels:** Formatted for standard label sheets
3. Print and attach to physical equipment

**From Gear List:**
1. Find item in gear list
2. Click "Print QR" in item detail
3. Or select multiple items and click "Print Selected QR Codes"

---

### Gear List Management

#### Viewing Gear

**Main View:**
- Gear grouped by band (expandable/collapsible)
- Color-coded by location
- Status indicators (Transit, Stage, Missing)
- Time since last update
- Real-time updates

**Item Display:**
- Display ID (G001, G002, etc.)
- Description
- Current location (with color)
- Status badges
- Last updated timestamp

#### Status Indicators

- **Active:** Located in specific venue area (shows location)
- **In Transit:** Moving between locations (yellow badge)
- **On Stage:** Currently performing (green badge)
- **Checked Out:** With band (blue badge)
- **Missing:** Reported as lost/missing (red pulsing badge)

#### Filtering

Click filter buttons to show only:
- **By Band:** Select specific band
- **By Location:** Select specific location
- **By Status:** Active, Transit, On Stage, Checked Out, Missing

#### Search

- Real-time search box at top
- Searches across:
  - Band names
  - Item descriptions
  - Display IDs (G001, etc.)

#### Individual Item Actions

**View Item Detail:**
1. Click on any item in list
2. Modal shows full details:
   - Band name
   - Description
   - Current location
   - Status
   - Last updated timestamp
   - Scan history

**Available Actions (all users):**
- **Edit:** Change description or band name
- **Change Location:** Select new location from dropdown
- **Mark In Transit:** Item being moved
- **Mark On Stage:** Item currently performing
- **Check Out to Band:** Return to band
- **Report Missing:** Flag as lost
- **View Scan History:** See all location changes and scans

**Additional Actions (Admin/Owner only):**
- **Delete Item:** Permanently remove (requires confirmation)

#### Bulk Operations

**Selecting Items:**
- Check boxes next to items
- "Select All in Band" button
- "Select All in Location" button
- "Select All in Current Filter" button
- "Clear Selection" button

**Bulk Actions (all users):**
- **Bulk Location Change:** Move all selected to new location
- **Bulk Mark In Transit:** Mark all selected as moving
- **Bulk Mark On Stage:** Mark all selected as performing
- **Bulk Check Out to Band:** Return all selected to bands

**Bulk Actions (Admin/Owner only):**
- **Bulk Delete:** Delete all selected items (requires confirmation)

#### Missing Item Management

**Reporting Missing:**
1. Find item in Gear List
2. Open item detail
3. Click "Report Missing"
4. Confirm alert
5. System records:
   - Who reported it
   - When reported
   - Last known location
6. Alert appears on message bar for all users
7. Item gets pulsing red badge

**Finding Missing Items:**

**Method 1: Via Scan**
1. Scan the item's QR code
2. System automatically resolves missing status
3. Alert shows "Missing item found!"
4. Select new location
5. Recovery recorded in scan history

**Method 2: Via Manual Recovery**
1. Open missing item detail
2. Click "Found It" button
3. Select location where found
4. Status changes to active
5. Recovery recorded

**Viewing All Missing Items:**
- Click missing count in message bar
- Or filter by "Missing" status
- Shows all missing items with:
  - Last known location
  - Who reported it
  - When reported

---

### Location Management

**Who can do this:** Owner and Admin only

#### Pre-configured Locations

When you create a festival, two locations are automatically created:
- **Band Registration Area** (Purple, 📝) - Where bands collect their QR tags
- **Tags Not Collected** (Red, ❌) - For tracking bands that haven't collected tags yet

These are designed for bulk gear pre-registration before bands arrive at the festival.

#### Viewing Locations

1. Click "Locations" on home page
2. See list of all locations with:
   - Name
   - Color indicator
   - Emoji icon (if set)
   - Edit and Delete buttons

#### Adding Location

1. Click "Add New Location"
2. Enter location name (e.g., "Main Stage", "Storage Tent", "Loading Bay")
3. Select color from palette:
   - Green, Blue, Orange, Red, Purple, Pink, Yellow, Teal, Gray
4. Optional: Add emoji icon for visual identification
5. Select type:
   - Registration
   - Stage
   - Storage
   - Custom
6. Click "Save"

**Location appears immediately:**
- In location dropdown when registering gear
- In location selection for check-in
- Color-coded in gear list

#### Editing Location

1. Click "Edit" next to location
2. Modify name, color, or emoji
3. Click "Save"
4. Changes reflect immediately across all gear

#### Deleting Location

1. Click "Delete" next to location
2. **Warning appears if gear is currently assigned**
3. Confirm deletion
4. Location removed
5. Gear previously at this location shows no location

**Important:** You cannot delete a location if items are currently assigned to it. Move or check out all gear first.

---

### Schedule Management

#### Viewing Schedule

**Main View:**
- Grouped by day (expandable/collapsible)
- Within day: grouped by stage/location
- Sorted by time within each stage
- Current day auto-expanded

**Display Options:**
- Toggle 12-hour / 24-hour time format
- Search/filter by band name
- Expand/collapse all

**Performance Details:**
- Band name
- Stage/location name
- Performance date
- Performance time
- Click to view all band gear

#### Viewing Band Gear from Schedule

**From Individual Performance:**
1. Click on any performance in schedule
2. Modal opens showing all gear for that band
3. Real-time status for each item:
   - Current location
   - In Transit status
   - On Stage status
   - Checked Out status
   - Missing status
4. Grouped by location
5. Click item to view full details

**From Stage View:**
1. Click "View All Gear" on any stage section
2. See all bands performing on that stage
3. Each band expandable to show gear
4. Status indicators for all items

#### Uploading Schedule CSV

**Who can do this:** Owner and Admin only

**CSV Format:**
```csv
Band Name, Location/Stage, Date (DD-MM-YYYY), Time (HH:MM)
The Rockers, Main Stage, 08-11-2025, 19:00
The Rockers, Acoustic Stage, 09-11-2025, 14:00
Jazz Masters, Main Stage, 08-11-2025, 21:00
Folk Trio, Main Stage, 09-11-2025, 16:30
```

**Steps:**
1. Open Schedule page
2. Click "Upload Schedule CSV"
3. Select CSV file
4. Preview parsed performances:
   - Band names
   - Stages/locations
   - Dates and times
5. System validates:
   - Stage names match existing locations
   - Dates are valid format
   - Times are in HH:MM format
6. Confirm import

**What happens:**
- Auto-creates band registry entries (if don't exist)
- Normalizes band names (removes extra spaces, special characters)
- Links performances to existing gear items (by band name)
- Performances appear in schedule immediately
- Gear items show performance times in list

#### Editing Performances

**Individual Performance:**
1. Click "Edit" on performance
2. Modify:
   - Time
   - Date
   - Location/stage
3. Save changes

**Deleting:**
- Delete individual performance
- Delete all performances for a band
- Delete all performances for a stage
- Delete entire day of performances

---

### Stowage Planning

**Who can do this:** Owner and Admin only

#### Purpose

Visual planning tool for packing gear into containers (trucks, trailers, flight cases) with 3D layering support. Helps crews plan efficient packing and visualize where items are stored.

#### Container Management

**Creating Container:**
1. Click "Stowage" on home page
2. Click "New Container"
3. Enter details:
   - **Name:** e.g., "Truck 1", "Flight Case A", "Storage Trailer"
   - **Length:** In feet (e.g., 20)
   - **Width:** In feet (e.g., 8)
   - **Height:** Number of layers (1-5) for stacking
   - **Associated Location:** Where container is located
4. Click "Save"

**Container Card:**
- Shows name and dimensions
- Capacity indicator (items assigned / total gear)
- Progress bar
- "View" button to open canvas
- "Clear" button to remove all items
- "Delete" button to remove container

**Viewing All Containers:**
- Grid view of all containers
- Sorted by name
- Color-coded by capacity

#### Visual Packing Canvas

**Opening Canvas:**
1. Click "View" on container card
2. Canvas opens showing:
   - Container outline (to scale)
   - Grid for positioning
   - Current items (if any)
   - Staged items panel (right side)
   - Layer selector (bottom)

**Canvas Features:**
- **Percentage-based positioning:** Responsive to screen size
- **Touch and drag support:** Mobile-friendly
- **Desktop mouse drag:** Click and drag items
- **Collision detection:** Prevents overlapping
- **Auto-save:** Positions save automatically

#### Adding Items to Container

**Method 1: Drag from Staged Area**
1. View unstaged gear in right panel
2. Filtered by items not assigned to any container
3. Click and drag item onto canvas
4. Position where desired
5. Release to place
6. Adjust size and layer if needed

**Method 2: Search and Add**
1. Use search box in staged panel
2. Find specific gear item
3. Click to add to container
4. Item appears at default position
5. Drag to desired location

**Item on Canvas:**
- Shows band name and description
- Color-coded by band
- Displays dimensions
- Layer indicator
- Drag handles for repositioning

#### Setting Item Properties

**Click on item to edit:**
- **Width:** In feet (default 2)
- **Length:** In feet (default 2)
- **Height:** Number of layers item occupies (default 1)
- **Layer (Z position):** Which layer item sits on (0 = ground)

**Example:**
- Large amp: 3ft x 3ft x 2 layers (occupies layers 0-1)
- Guitar case: 4ft x 1.5ft x 1 layer (single layer)
- Drum kit: 5ft x 5ft x 2 layers

#### Layer Management

**Viewing Layers:**
1. Use layer selector at bottom (0, 1, 2, 3, 4)
2. Click layer number to view that layer
3. Items on current layer shown solid
4. Items on other layers shown as shadow/outline
5. Multi-layer items show height indicator

**Stacking Logic:**
- Layer 0 = ground level
- Items can span multiple layers (height property)
- Collision detection works across layers
- Visual indicator shows which layers item occupies

**Example Packing:**
- Layer 0: Large amps, drum kits, heavy equipment
- Layer 1: Flight cases, medium equipment
- Layer 2: Small boxes, cables, lightweight items

#### Moving and Adjusting Items

**Repositioning:**
1. Click and drag item
2. Move to new position
3. Release to place
4. If collision detected, item returns to original position
5. Adjust as needed

**Removing from Container:**
1. Click item
2. Click "Remove from Container" button
3. Item returns to staged area
4. Can be added to different container or left unstaged

#### Collision Detection

**Features:**
- Prevents items from overlapping on same layer
- Checks all layers for multi-layer items
- Visual feedback (red outline) on collision
- Item snaps back if placed in invalid position

**Auto-Snap (Optional):**
- Grid-based snapping
- Helps align items neatly
- Toggle on/off in settings

#### Clearing and Deleting

**Clear Container:**
1. Click "Clear" on container card
2. Confirm action
3. All items removed back to unstaged area
4. Container remains for reuse

**Delete Container:**
1. Click "Delete" on container card
2. Warning: "This will permanently delete the container"
3. Confirm deletion
4. Container and all assignments removed
5. Items return to unstaged area

#### Capacity Tracking

**Container Card Shows:**
- Items assigned / Total gear count
- Percentage filled
- Visual progress bar
- Color changes (green → yellow → red as fills)

**Per-Band Breakdown:**
- Click "Details" to see items by band
- Shows which bands' gear is in container
- Counts per band

#### Mobile Touch Support

**Touch Gestures:**
- **Touch and drag:** Move items
- **Tap:** Select item
- **Long press:** Edit item properties
- **Two-finger drag:** Pan canvas
- **Pinch:** Zoom (if enabled)

**Optimized for:**
- Tablets
- Large phones
- Touch screens
- Responsive layout

---

### Team Messaging

#### Purpose

Broadcast announcements from admins to all users without disrupting workflow. No chat function - one-way communication for important updates.

#### Message Categories

**🚨 Urgent**
- Critical updates, emergencies, safety issues
- Auto-displays as popup modal
- Cannot be dismissed until acknowledged
- Use sparingly for true emergencies

**⚠️ Alert**
- Important issues, lost property, schedule changes
- Badge notification on Messages button
- Requires attention but not blocking

**📢 Announcement**
- General updates, reminders, festival info
- Badge notification only
- Normal priority

**ℹ️ Info**
- Helpful information, tips, FYI updates
- Badge notification only
- Lowest priority

#### Posting Messages

**Who can do this:** Owner and Admin only

**Steps:**
1. Click "Messages" on home page
2. Click "Post New Message"
3. Select category (Urgent, Alert, Announcement, Info)
4. Enter message text (500 character maximum)
5. Optional: Check "Pin to top" to keep message at top of list
6. Click "Post Message"

**Features:**
- Character counter shows remaining characters
- Preview of how message will look
- Author name and timestamp automatically added
- Cannot edit after posting (delete and repost if needed)

**Best Practices:**
- Use Urgent sparingly (real emergencies only)
- Be concise and clear
- Include relevant band/location names
- Pin important messages that need visibility

#### Reading Messages

**All Users:**
1. Click "Messages" button on home page
2. **Unread count badge** shows number of unread messages
3. Message list opens showing:
   - Pinned messages at top (sorted by pin date)
   - Recent messages below (sorted by post time)
   - Color-coded by category
   - "NEW" badge on unread messages

**Message Display:**
- Category icon and color
- Author name
- Post timestamp
- Message content
- Pin indicator (if pinned)

**Auto-Mark as Read:**
- All messages automatically marked read when message page is viewed
- Unread count clears
- "NEW" badges disappear

#### Managing Messages (Admin/Owner)

**Pin/Unpin:**
- Click pin icon on message
- Pinned messages stay at top
- Useful for ongoing situations

**Delete:**
- Click delete icon
- Confirm deletion
- Message removed for all users

**Note:** Messages cannot be edited after posting. To fix a typo, delete and repost.

#### Urgent Message Popup

**Behavior:**
- Appears automatically on app load if unread urgent message exists
- Checks every 30 seconds for new urgent messages while app is open
- Shows one message at a time (oldest first)
- Dark overlay prevents interaction with rest of app
- Must be dismissed to continue using app

**Popup Display:**
- Large "URGENT MESSAGE" header
- Red border with pulsing glow animation
- Message content
- Author and timestamp
- Two buttons:
  - "View All Messages" - Navigate to messages page
  - "Dismiss" - Mark as read and close (shows next urgent if exists)

**Use Cases:**
- Lost child alert
- Severe weather warning
- Emergency evacuation
- Critical safety issue
- Missing medication alert

---

### Personal Reminders

**Who can use this:** All users

#### Purpose

Create personal to-do items related to festival gear and bands. Reminders are private - only visible to you. Useful for tracking tasks, follow-ups, and personal notes.

#### Creating Reminder

**Steps:**
1. Click "Reminders" on home page
2. Click "Add New Reminder"
3. Fill in form:
   - **Title:** Brief description (required)
   - **Description:** Longer notes (optional)
   - **Due Date:** When task is due (optional)
   - **Related Band:** Link to specific band (optional)
   - **Related Gear:** Link to specific gear item (optional)
4. Click "Save Reminder"

**Examples:**
- Title: "Check drum kit before Rockers perform"
  - Due: Today 6:00 PM
  - Band: The Rockers
  - Gear: Drum Kit (G042)

- Title: "Follow up on missing guitar"
  - Due: Tomorrow
  - Band: Jazz Masters
  - Gear: Guitar (G015)

#### Managing Reminders

**List View:**
- All your reminders in one list
- Sorted by:
  1. Overdue (red, at top)
  2. Due date (nearest first)
  3. Created date (newest first)

**Filter Options:**
- **Active:** Incomplete reminders only
- **Completed:** Completed reminders only
- **All:** Show everything

**Reminder Display:**
- Title and description
- Due date with color coding:
  - Red: Overdue
  - Yellow: Due today
  - Green: Future
- Related band name (if specified)
- Related gear link (if specified)
- Completion checkbox

#### Actions

**Mark Complete/Incomplete:**
- Click checkbox to toggle
- Completed reminders get strikethrough
- Still visible in "Completed" filter

**Edit:**
- Click "Edit" button
- Modify any fields
- Save changes

**Delete:**
- Click "Delete" button
- Confirm deletion
- Reminder permanently removed

**View Linked Gear:**
- If gear item specified, click to view
- Shows current gear status and location
- Link opens gear detail modal

#### Reminders Badge

- Reminders button shows badge with count of active (incomplete) reminders
- Overdue reminders not highlighted in badge (check page)
- No automatic popups or notifications

#### Use Cases

- Remember to check specific gear before performance
- Follow up on missing items
- Personal tasks related to bands
- Notes about special equipment handling
- Reminders to contact band members

---

### Status Dashboard

#### Info Bar (Top of Home Page)

**Real-Time Gear Counts:**

Displays count of items in each status:

- **Active:** Items currently in specific locations (not transit, not checked out)
- **Transit:** Items marked as moving between locations (yellow)
- **On Stage:** Items currently being used in performances (green)
- **Checked Out:** Items returned to bands (blue)
- **Missing:** Items reported as lost/missing (red, pulsing animation)

**Interactive:**
- Click any status count to see filtered list
- Modal opens showing all items in that status
- Items grouped by band
- Shows location for each item (if applicable)
- Click item to view full details

**Auto-Refresh:**
- Counts update in real-time as gear status changes
- No need to refresh page

#### Missing Items Alert

**Visual Indicator:**
- Red pulsing animation on message bar when items missing
- Shows: "⚠️ X items missing - View"
- Visible to all users on home page
- Impossible to miss

**Click to View:**
- Opens gear list filtered by "Missing" status
- Shows all missing items with:
  - Band name
  - Description
  - Last known location
  - Who reported missing
  - When reported
  - "Found It" button for manual recovery

**Alert Conditions:**
- Appears when any item marked as missing
- Disappears when all missing items resolved
- Updates immediately

---

## Advanced Features

### Offline-First Architecture

#### How It Works

- Uses **IndexedDB** (via Dexie.js) for local storage
- Uses **Firestore** for cloud sync
- All data stored locally first
- Syncs to cloud when connection available
- Full functionality works offline

#### Offline Capabilities

**You CAN do offline:**
- View all gear, locations, schedule
- Scan QR codes
- Update gear status (check in/out, mark transit, mark on stage)
- Register new gear items
- Edit gear details
- View messages (cached)
- View schedule
- Work on stowage plans

**You CANNOT do offline:**
- Post new messages
- Invite users
- Bulk CSV uploads
- Real-time collaboration (changes sync when online)

#### Sync Behavior

**When Online:**
- Changes sync immediately to cloud
- All users see updates in real-time (within 60 seconds)

**When Offline:**
- Changes saved locally
- Queued for sync
- Visual indicator may show "Offline" status

**When Connection Restored:**
- Automatic sync of all queued changes
- Usually completes within seconds
- Conflict resolution (last write wins)
- No data loss

### QR Code System

#### QR Code Format

- Format: `GEAR:{firestore_id}`
- Example: `GEAR:abc123xyz789`
- Each code is unique to one item
- Generated automatically on registration

#### Scanning Technology

- Uses **jsQR** library for code detection
- Works with rear or front camera
- Tolerates various lighting conditions
- Debounce prevents duplicate scans (3 second cooldown)
- Works with printed or screen-displayed codes

#### Print Layouts

**Small Tags:**
- Multiple tags per sheet
- Designed for label printers
- Includes display ID and description
- QR code size optimized for scanning

**Large Sheet:**
- One QR code per page
- Maximum visibility
- Includes all item details
- Good for large equipment

**Label Format:**
- Formatted for standard label sheets (e.g., Avery labels)
- Compact but scannable
- Includes essential info

### Band Name Normalization

#### Purpose

Prevents duplicate bands with slight name variations (e.g., "The Rockers" vs "the rockers" vs "The  Rockers!").

#### Normalization Rules

1. Convert to lowercase
2. Remove special characters
3. Collapse multiple spaces to single space
4. Trim leading/trailing spaces

#### Examples

- "The Rockers" → "therockers"
- "  Jazz  Masters! " → "jazzmasters"
- "Folk-Trio" → "folktrio"

#### Impact

- Autocomplete suggests existing bands
- Prevents: "The Rockers", "the rockers", "The  Rockers!" from creating 3 separate bands
- Schedule import matches existing bands correctly
- Gear linked to correct band across variations

### Real-Time Status Updates

#### Dashboard

- Counts update immediately when gear status changes
- No page refresh needed
- Clickable for detailed view

#### Gear List

- Auto-refresh every 60 seconds
- Manual refresh on page focus
- Optimistic updates (UI updates immediately, syncs in background)
- Status indicators update in real-time

#### Schedule Integration

- Performance times linked to gear
- View gear status from schedule
- Click performance to see all band gear with current locations
- Auto-refresh when page focused

### Mobile Optimization

#### Touch Support

- **Touch and drag** for stowage items
- **Tap targets** minimum 48px for easy selection
- **Swipe gestures** where applicable (lists, modals)
- **Pinch to zoom** on stowage canvas (if implemented)

#### Responsive Design

- Single-column layout on mobile
- Collapsible sections for better navigation
- Mobile-first approach
- Large, tappable buttons
- Readable font sizes

#### PWA Features

- **Install to home screen** (Android, iOS)
- **Works offline** with full functionality
- **Background sync** when connection restored
- **App-like experience** without app store
- **Fast loading** with service worker caching

### Color Coding System

#### Locations

- Custom color per location
- 9 preset colors available
- Visual identification in gear list
- Consistent across entire app
- Makes gear easy to locate at a glance

#### Messages

- **Urgent:** Red (#f44336)
- **Alert:** Yellow (#ffc107)
- **Announcement:** Orange (#ffa500)
- **Info:** Blue (#2196f3)

#### Status Indicators

- **Missing:** Pulsing red (impossible to miss)
- **On Stage:** Green badge
- **In Transit:** Yellow badge
- **Checked Out:** Blue badge
- **Active:** Location color

### CSV Import/Export

#### Supported Import Formats

**Gear Import:**
- Basic: `Band Name, Item Description`
- With Schedule: `Band Name, Item Description, Schedule Data`

**Schedule Import:**
- `Band Name, Location, Date (DD-MM-YYYY), Time (HH:MM)`

**User Import:**
- `Name, Email, Role`

#### Import Features

- Validates all data before import
- Preview parsed records
- Shows errors clearly
- Rollback on failure
- Progress indicator for large imports

### Scan History & Audit Trail

#### What's Tracked

Every gear action is recorded:
- Timestamp
- User who performed action
- Location (before and after)
- Action type (check in, check out, transit, etc.)

#### Viewing History

**Per-Item:**
1. Open gear item detail
2. Click "View Scan History"
3. See chronological list of all actions

**Display:**
- Action description
- User name
- Timestamp
- Location (if applicable)

#### Use Cases

- Dispute resolution (who last had the item)
- Lost item investigation (trace last movements)
- Performance metrics (how often scanned)
- Accountability (who performed actions)

### Performance-Gear Linking

#### Automatic Linking

When schedule is uploaded:
- Bands automatically linked to gear items (by band name)
- Gear items show performance times
- Schedule shows gear status for each performance

#### Benefits

- Crew knows when gear needed on stage
- Can prepare gear ahead of performance time
- Real-time status visible in schedule
- Reduces lost/late gear incidents
- Better coordination between crew and bands

### Stowage 3D Layering

#### Layer System

- **Z-axis support:** 0 = ground level, 1-4 = stacked layers
- **Multi-layer items:** Items can span multiple layers (height property)
- **Visual indicators:** Show which layers item occupies
- **Layer-by-layer view:** Select layer to see items on that level

#### Collision Detection

- Prevents overlapping items on same layer
- Checks all layers for multi-layer items
- Visual feedback (red outline) when collision detected
- Items snap back to valid position if placed incorrectly

#### Canvas Features

- Percentage-based positioning (responsive to screen size)
- Touch drag support for mobile
- Desktop mouse drag
- Zoom controls (future feature)
- Export/screenshot layout for reference

---

## Troubleshooting

### Common Issues

#### Cannot Scan QR Codes

**Possible causes and solutions:**

1. **Camera permissions denied**
   - Go to browser settings
   - Allow camera access for this site
   - Refresh page

2. **Poor lighting**
   - Move to brighter area
   - Use device flashlight
   - Avoid direct sunlight (can wash out code)

3. **QR code damaged or blurry**
   - Print new code at larger size
   - Use "Large Sheet" print layout
   - Ensure printer quality is good

4. **Camera lens dirty**
   - Clean lens with soft cloth
   - Try again

5. **Fallback option**
   - Use manual entry
   - Search for item in Gear List
   - Select action directly

#### Gear Not Appearing in List

**Possible causes and solutions:**

1. **Filters applied**
   - Check filter buttons (band, location, status)
   - Click "Clear Filters" or "Show All"

2. **Wrong festival selected**
   - Verify correct festival in header
   - If multiple festivals, switch to correct one

3. **Not synced yet**
   - Wait a few seconds
   - Refresh page (pull down or F5)

4. **Network connection issues**
   - Check if online/offline
   - If offline, wait for sync when back online

5. **Browser cache issue**
   - Clear browser cache
   - Hard refresh (Ctrl+F5 / Cmd+Shift+R)

#### Changes Not Syncing

**Possible causes and solutions:**

1. **Offline**
   - Check network connection
   - Changes queued, will sync when online

2. **Slow connection**
   - Wait up to 60 seconds for sync
   - Check status indicator

3. **Firestore connection issue**
   - Refresh page
   - Check Firebase status (firebase.google.com/status)

4. **Browser blocking**
   - Disable ad blockers temporarily
   - Allow third-party cookies
   - Check browser console for errors

#### Missing Items Not Resolving

**Possible causes and solutions:**

1. **Wrong item scanned**
   - Verify display ID matches
   - Check band name
   - Ensure correct item

2. **Manual recovery not working**
   - Use "Found It" button in item detail
   - Select location where found
   - Confirm action

3. **Permissions issue**
   - Verify you have user role or higher
   - Check with admin/owner

4. **Browser issue**
   - Refresh page
   - Clear cache
   - Try different browser

#### Stowage Items Not Saving

**Possible causes and solutions:**

1. **Insufficient permissions**
   - Only Admin/Owner can edit stowage plans
   - Check your role with owner

2. **Network connection**
   - Check if online
   - Changes queue offline, sync when online

3. **Container doesn't exist**
   - Verify container still exists (not deleted)
   - Refresh page

4. **Collision detected**
   - Item overlaps with another
   - Reposition to valid location
   - Adjust item size if needed

#### Users Not Receiving Invitations

**Possible causes and solutions:**

1. **Email typo**
   - Verify email address spelling
   - Check for extra spaces
   - Resend invitation

2. **Spam folder**
   - Ask user to check spam/junk mail
   - Add sender to contacts

3. **Email not sent**
   - Check network connection when inviting
   - Try bulk form method instead
   - Verify Firebase email configuration

4. **Festival ID mismatch**
   - Delete old invitation
   - Create new invitation
   - Verify correct festival selected

### Getting Help

If you encounter issues not covered here:

1. **Check browser console** for error messages (F12)
2. **Try different browser** (Chrome, Firefox, Safari, Edge)
3. **Clear browser data** (cache, cookies)
4. **Contact festival owner** for permissions issues
5. **Document the issue** (screenshots, steps to reproduce)

### Best Practices

**To avoid common issues:**

1. **Register all gear during setup** (not piecemeal during event)
2. **Print QR codes immediately** after registration
3. **Use descriptive location names** (avoid "Location 1", "Area A")
4. **Report missing items promptly** (increases recovery chances)
5. **Regular data backups** (export CSVs periodically)
6. **Assign multiple admins** (redundancy if owner unavailable)
7. **Train staff** on basic operations before event
8. **Test scanning** in venue lighting conditions
9. **Have manual process** as backup (pen and paper)
10. **Keep app updated** (refresh page daily)

---

## Appendix

### Data Persistence

- Local data stored indefinitely in browser
- Cloud sync preserves all data in Firestore
- Clearing browser data removes local copy (cloud backup remains)
- Export CSVs recommended for backups

### Browser Compatibility

- **Chrome/Edge:** Full support, recommended
- **Safari:** Full support (iOS and macOS)
- **Firefox:** Full support
- **Others:** May work but not officially tested

**Requirements:**
- Modern browser (last 2 years)
- JavaScript enabled
- Camera required for QR scanning

### Camera Permissions

- Required for QR code scanning only
- Can deny and use manual entry instead
- Rear camera preferred (better focus)
- Falls back to front camera if rear unavailable
- Permissions persist until browser data cleared

### Network Requirements

**Offline Mode:**
- Full functionality for most operations
- Gear registration, scanning, status updates work
- Schedule and location viewing work

**Online Required:**
- Posting messages
- Inviting users
- Bulk CSV uploads
- Real-time collaboration

**Sync:**
- Auto-sync when connection restored
- No data loss when offline
- Changes queued locally

### Security

- Firestore security rules enforced
- Role-based access control (Owner, Admin, User)
- Users cannot access other festivals' data
- Owner cannot be removed (protects festival ownership)
- Invitations single-use (expire after signup)
- No public access (authentication required)

### Performance Considerations

- **Large gear lists (500+ items):** May slow down
  - Use filters to reduce visible items
  - Search for specific items
  - Consider pagination (not yet implemented)

- **Many users online:** No significant impact
  - Firestore handles concurrent users
  - Each user gets own real-time feed

- **Large containers:** Stowage canvas may slow
  - Limit to 50-100 items per container
  - Use multiple containers for large operations

### Known Limitations

- No gear archiving (all items always visible)
- No multi-festival switching in UI (database supports it, UI doesn't)
- No push notifications (future feature)
- No real-time collaborative editing (sync delay up to 60 seconds)
- Message editing not implemented (delete and repost)
- No undo functionality (actions are immediate)
- No export to PDF or Excel (CSV only)

### Future Features

Possible upcoming features:
- Gear archiving/history
- Push notifications for urgent messages
- Export to PDF/Excel
- Barcode scanning (in addition to QR)
- Mobile app versions (iOS/Android)
- Advanced reporting and analytics
- Multi-language support

---

**End of User Guide**

For quick start instructions, see `QUICK_START.md`
For admin-specific features, see `ADMIN_GUIDE.md`
For workflow examples, see `WORKFLOWS.md`
For frequently asked questions, see `FAQ.md`
