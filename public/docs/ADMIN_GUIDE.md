# Festival Gear Tracker - Admin Guide

Complete guide for Festival Owners and Admins managing the system.

## Table of Contents

1. [Admin vs Owner Permissions](#admin-vs-owner-permissions)
2. [User Management (Owner Only)](#user-management-owner-only)
3. [Bulk Operations](#bulk-operations)
4. [Location Management](#location-management)
5. [Schedule Management](#schedule-management)
6. [Stowage Planning](#stowage-planning)
7. [Team Messaging](#team-messaging)
8. [Best Practices](#best-practices)
9. [Advanced Tips](#advanced-tips)

---

## Admin vs Owner Permissions

### What Owners Can Do (That Admins Cannot)

**User Management:**
- Invite new users
- Remove users
- Change user roles
- View all user accounts
- Cannot be removed themselves

**Festival Management:**
- Delete festival
- Change festival settings
- Transfer ownership (future feature)

### What Both Owners and Admins Can Do

**Gear Management:**
- Bulk CSV uploads
- Delete gear items
- All scanning and status operations

**Location Management:**
- Create locations
- Edit locations
- Delete locations

**Schedule Management:**
- Upload schedule CSV
- Edit performances
- Delete performances

**Stowage Planning:**
- Create containers
- Edit stowage plans
- Delete containers

**Team Messaging:**
- Post messages (all categories including Urgent)
- Pin messages
- Delete messages

### What Regular Users Can Do

- Scan QR codes
- Register single items
- Edit gear details
- Change locations (single or bulk)
- View schedule
- Read messages
- Create personal reminders

**Note:** Users cannot delete items, upload CSVs, or manage locations.

---

## User Management (Owner Only)

### Inviting Users

#### Method 1: Single Invite

**Best for:** Adding 1-5 users

**Steps:**
1. Navigate to "User Management"
2. Click "Invite User"
3. Fill in form:
   - Email address
   - Role selection:
     - **Admin:** For supervisors, trusted staff
     - **User:** For volunteers, general crew
4. Click "Send Invitation"

**What happens:**
- Email sent to user with invitation link
- Link includes festival ID and pre-assigned role
- User signs up and is automatically added
- Invitation single-use (expires after signup)

#### Method 2: Bulk CSV Upload

**Best for:** Adding 10+ users at once

**CSV Format:**
```csv
Name,Email,Role
John Smith,john@crew.com,admin
Jane Doe,jane@crew.com,user
Mike Wilson,mike@crew.com,user
Sarah Jones,sarah@crew.com,admin
```

**Steps:**
1. Prepare CSV file with headers
2. Navigate to "User Management"
3. Click "Bulk Upload CSV"
4. Select file
5. Preview parsed users
6. Verify names, emails, roles correct
7. Click "Confirm Import"

**Validation:**
- Checks email format
- Validates role (admin or user only, not owner)
- Shows errors before sending
- Skips duplicates

**What happens:**
- All users receive invitation emails
- Each invitation links to signup with pre-assigned role
- Users appear in pending invitations list
- Status updates when they sign up

#### Method 3: Bulk Form

**Best for:** Adding 5-10 users without preparing CSV

**Steps:**
1. Click "Bulk Invite Form"
2. Enter users directly in web form
3. Add rows as needed (Name, Email, Role)
4. Submit form
5. Confirm invitations

**Advantages:**
- No CSV file needed
- Quick for small batches
- See all entries before sending

### Managing Existing Users

#### Viewing Users

**User List Shows:**
- Display name
- Email address
- Role (Owner, Admin, User)
- Join date
- Last active (if available)

**Filter Options:**
- By role (Owner, Admin, User)
- Search by name or email

#### Changing User Role

**Steps:**
1. Find user in list
2. Click "Edit" or "Change Role"
3. Select new role (Admin or User)
4. Confirm change

**Takes effect immediately**
- User's permissions update
- No notification sent (inform them separately)

**Important:** Cannot change Owner role or remove Owner

#### Removing User

**Steps:**
1. Find user in list
2. Click "Remove" or "Delete"
3. Confirm removal

**What happens:**
- User loses access to festival
- Their actions remain in history (audit trail)
- Can be re-invited later if needed

**Cannot remove:**
- Yourself (prevents lockout)
- Festival Owner (protection)

### Invitation Management

#### Viewing Pending Invitations

**Shows:**
- Email address
- Role assigned
- Date invited
- Status (Pending or Accepted)

**Actions:**
- Resend invitation
- Cancel invitation
- Change role before acceptance

#### Resending Invitation

If user didn't receive email:
1. Find invitation in pending list
2. Click "Resend"
3. New email sent with same link

#### Canceling Invitation

If mistake or user no longer needed:
1. Find invitation in pending list
2. Click "Cancel"
3. Invitation link becomes invalid
4. Can invite again with correct details

---

## Bulk Operations

### Bulk Gear Upload (CSV)

#### CSV Format Options

**Option 1: Basic Format**
```csv
Band Name, Item Description
The Rockers, Guitar
The Rockers, Bass Guitar
The Rockers, Drum Kit
Jazz Masters, Saxophone
Jazz Masters, Keyboard
```

**Option 2: With Schedule Data**
```csv
Band Name, Item Description, Schedule Data
The Rockers, Guitar, Main Stage~08-11-2025~19:00|Acoustic Stage~09-11-2025~14:00
The Rockers, Drum Kit, Main Stage~08-11-2025~19:00
Jazz Masters, Saxophone, Main Stage~08-11-2025~21:00
```

**Schedule Format:** `Location~DD-MM-YYYY~HH:MM|Location~DD-MM-YYYY~HH:MM`

#### Upload Process

**Steps:**
1. Click "Bulk Upload" on home page
2. Select CSV format:
   - Basic (gear only)
   - With Schedule (gear + performances)
3. Click "Choose File" and select CSV
4. Select initial location for all items (e.g., "Tags Not Collected")
5. Preview parsed data:
   - Number of items
   - Number of bands
   - Number of performances (if included)
6. Review for errors
7. Click "Confirm Import"

**What Happens:**
- All gear items created with QR codes
- Sequential IDs assigned (G001, G002, etc.)
- Bands created or linked to existing
- Performances created (if included)
- Items assigned to selected location

**Validation:**
- Checks for required columns
- Validates band names (deduplication)
- Validates dates and times (if schedule included)
- Shows errors before import
- Rollback on failure (all-or-nothing)

#### After Upload

**Immediate Actions:**
1. Print all QR codes:
   - Click "Print QR Codes" on success screen
   - Choose "Small Tags" for bulk printing
   - Print labels
2. Organize labels by band
3. Attach to equipment as bands arrive

#### Common Issues

**Duplicate band names:**
- System normalizes names (lowercase, no special chars)
- "The Rockers" and "the rockers" treated as same band

**Date format errors:**
- Must be DD-MM-YYYY
- Not MM-DD-YYYY or YYYY-MM-DD

**Missing columns:**
- CSV must have headers
- Order doesn't matter but names must match

**Special characters:**
- Avoid in band names and descriptions
- System strips most special characters

### Bulk Location Changes

**Scenario:** Move many items to new location at once

**Steps:**
1. Open "Gear List"
2. Use filters to narrow down (e.g., by band or current location)
3. Select items:
   - Check boxes individually, OR
   - Click "Select All in Band", OR
   - Click "Select All in Location"
4. Click "Change Location"
5. Select destination location
6. Confirm change

**All selected items:**
- Move to new location immediately
- Status changes to "Active"
- Timestamp updated
- Your name recorded in scan history

**Use Cases:**
- Moving all band gear from registration to storage
- Moving all items from stage back to storage
- Preparing gear for multiple bands at once

### Bulk Status Changes

**Available Bulk Actions:**
- Mark In Transit
- Mark On Stage
- Check Out to Band

**Steps:**
1. Select multiple items (checkboxes)
2. Click desired action button
3. Confirm if prompted

**Example: Moving Multiple Bands to Stage**
1. Filter by location "Storage"
2. Select all items for bands about to perform
3. Click "Mark In Transit"
4. Move gear to stage
5. Select same items again
6. Click "Mark On Stage"

### Bulk Delete

**Careful:** This is permanent!

**Steps:**
1. Select items to delete (checkboxes)
2. Click "Delete Selected"
3. Warning: "This will permanently delete X items"
4. Type "DELETE" to confirm (safety measure)
5. Click "Confirm Delete"

**Items are:**
- Permanently removed from database
- QR codes become invalid
- Scan history preserved (audit trail)

**Cannot undo!**

**When to use:**
- Correcting registration mistakes
- Removing test data
- Cleaning up after festival
- Duplicate items

---

## Location Management

### Understanding the Default Locations

When you create a festival, two locations are automatically created:

**Band Registration Area (Purple, 📝)**
- Purpose: Where bands collect their QR tags
- Use case: Initial gear assignment during registration
- Workflow: Register gear → Assign to this location → Print tags → Bands collect

**Tags Not Collected (Red, ❌)**
- Purpose: Tracking bands that haven't collected tags yet
- Use case: Bulk pre-registration before bands arrive
- Workflow: Bulk upload gear → Assign to "Tags Not Collected" → Move to "Band Registration Area" when collected

### Creating Effective Locations

**Recommended Locations for Festivals:**

**Stages/Performance Areas:**
- Main Stage
- Acoustic Stage
- Electronic Stage
- DJ Booth
- (Name after actual venue stages)

**Storage Areas:**
- Secure Storage
- Band Storage
- Equipment Warehouse
- Green Room Storage
- (Use descriptive names)

**Transit/Loading:**
- Loading Dock
- Truck 1, Truck 2 (if multiple)
- In Transit (general)

**Special Areas:**
- Lost & Found
- Repair Station
- Checkout Area

### Adding Location

**Steps:**
1. Click "Locations"
2. Click "Add New Location"
3. Enter details:
   - **Name:** Descriptive (e.g., "Main Stage", not "Stage 1")
   - **Type:** Registration, Stage, Storage, or Custom
   - **Color:** Pick from 9 presets (visual coding)
   - **Emoji:** Optional icon (e.g., 🎸 for stage, 📦 for storage)
4. Click "Save"

**Best Practices:**
- Use actual venue names (not generic)
- Choose distinct colors (easy to identify at a glance)
- Add emojis for quick visual identification
- Create locations before bulk upload (smoother workflow)

### Editing Locations

**What You Can Change:**
- Name
- Color
- Emoji

**What You Cannot Change:**
- Type (would require recreating location)
- ID (internal reference)

**Steps:**
1. Click "Edit" next to location
2. Modify fields
3. Click "Save"

**Changes Apply:**
- Immediately to all gear
- In gear list display
- In location dropdowns
- In scan check-in options

### Deleting Locations

**Restrictions:**
- Cannot delete if gear currently assigned
- Must move all gear first

**Steps:**
1. Click "Delete" next to location
2. If gear assigned, warning appears with count
3. Move gear to different location or check out
4. Try delete again
5. Confirm deletion

**After Deletion:**
- Location removed from all lists
- Cannot be assigned to new gear
- Historical references preserved (audit trail)

### Location Colors

**Available Colors:**
- Green (#2ecc71)
- Blue (#3498db)
- Orange (#f39c12)
- Red (#e74c3c)
- Purple (#9b59b6)
- Pink (#e91e63)
- Yellow (#ffc107)
- Teal (#00bcd4)
- Gray (#95a5a6)

**Color Coding Strategy:**
- **Green:** Storage (safe, stored)
- **Blue:** Main stages (primary performance areas)
- **Orange:** Transit areas (movement)
- **Red:** Issues (tags not collected, lost & found)
- **Purple:** Registration areas
- **Gray:** Checked out, neutral areas

---

## Schedule Management

### Uploading Schedule CSV

#### CSV Format

**Required Columns:**
```csv
Band Name, Location/Stage, Date (DD-MM-YYYY), Time (HH:MM)
The Rockers, Main Stage, 08-11-2025, 19:00
The Rockers, Acoustic Stage, 09-11-2025, 14:00
Jazz Masters, Main Stage, 08-11-2025, 21:00
Folk Trio, Acoustic Stage, 09-11-2025, 16:30
```

**Column Details:**
- **Band Name:** Must match (case-insensitive, normalized)
- **Location/Stage:** Must match existing location name
- **Date:** Must be DD-MM-YYYY format
- **Time:** Must be HH:MM (24-hour format)

#### Upload Process

**Steps:**
1. Prepare CSV with all performances
2. Navigate to "Schedule" page
3. Click "Upload Schedule CSV"
4. Select CSV file
5. Preview shows:
   - Number of performances
   - Number of unique bands
   - Date range
   - Locations used
6. System validates:
   - Locations exist (creates if missing in some cases)
   - Dates are valid
   - Times are valid format
7. Click "Confirm Import"

**What Happens:**
- All performances created
- Bands auto-created (if don't exist)
- Band names normalized (prevents duplicates)
- Existing gear linked to performances
- Schedule page updates immediately

#### Linking to Gear

**Automatic Linking:**
- When schedule uploaded, bands matched to existing gear
- When gear registered, band matched to existing schedule
- Links persist (bidirectional)

**View from Schedule:**
- Click any performance to see all band gear
- Real-time status shown (location, transit, stage, missing)

**View from Gear:**
- Performance times shown in gear list
- Click to view full performance details

### Managing Performances

#### Editing Performance

**Steps:**
1. Find performance in schedule
2. Click "Edit"
3. Modify:
   - Date
   - Time
   - Location/stage
4. Click "Save"

**Changes:**
- Apply immediately
- All users see updated schedule
- Gear links preserved

#### Deleting Performances

**Individual Performance:**
1. Click "Delete" on performance
2. Confirm deletion
3. Performance removed

**Bulk Delete Options:**
- Delete all performances for a band
- Delete all performances on a stage
- Delete entire day of performances

**Warning:** Deletion is permanent (no undo)

### Schedule Best Practices

**Upload Before Festival:**
- Allows gear linking from start
- Crew can see performance times immediately
- Easier to plan gear preparation

**Keep Updated:**
- Edit schedule if performance times change
- Delete canceled performances
- Add last-minute additions

**Use Actual Location Names:**
- Match your venue stage names exactly
- Prevents confusion ("Main Stage" not "Stage 1")

---

## Stowage Planning

### Purpose

Visual tool for planning how to pack gear into containers (trucks, trailers, flight cases). Supports 3D layering for realistic stacking plans.

### Creating Containers

**When to Create:**
- Before packing trucks for transport
- For flight case organization
- Storage planning
- Loading/unloading coordination

**Steps:**
1. Click "Stowage" on home page
2. Click "New Container"
3. Enter details:
   - **Name:** Descriptive (e.g., "Truck 1", "Main Transport Truck", "Flight Case A")
   - **Length:** In feet (e.g., 20 for standard truck)
   - **Width:** In feet (e.g., 8 for standard truck)
   - **Height:** Number of stackable layers (1-5)
     - 1 layer: Small container, no stacking
     - 2-3 layers: Standard truck
     - 4-5 layers: Large truck or warehouse
   - **Location:** Where container is located (e.g., "Loading Dock")
4. Click "Save"

**Container Appears:**
- In stowage list with capacity indicator
- Ready for visual packing

### Visual Packing Workflow

#### Opening Canvas

1. Click "View" on container card
2. Canvas opens showing:
   - Container outline (scaled to dimensions)
   - Grid overlay
   - Layer selector (bottom)
   - Staged items panel (right)

#### Understanding the Canvas

**Container View:**
- Rectangular outline represents container dimensions
- Grid helps with positioning
- Percentage-based (responsive to screen size)

**Staged Items Panel (Right):**
- Lists all gear not yet assigned to any container
- Searchable
- Drag items onto canvas

**Layer Selector (Bottom):**
- Shows available layers (0, 1, 2, etc.)
- Click to view specific layer
- 0 = ground level

#### Adding Items

**Method 1: Drag and Drop**
1. Find item in staged panel
2. Click and hold on item
3. Drag onto canvas
4. Position where desired
5. Release to place
6. Auto-saves

**Method 2: Search and Add**
1. Search for specific item in staged panel
2. Click item
3. Item appears at default position on canvas
4. Drag to desired location

#### Positioning Items

**Moving Items:**
- Click and drag to reposition
- Items snap to grid (optional)
- Collision detection prevents overlap

**Setting Item Dimensions:**
1. Click on item
2. Edit properties:
   - Width (feet)
   - Length (feet)
   - Height (layers)
   - Layer (Z position)
3. Click "Save"

**Example Item Sizes:**
- Guitar case: 4ft x 1.5ft x 1 layer
- Amp: 2ft x 2ft x 1 layer
- Drum kit: 5ft x 5ft x 2 layers
- Speaker: 2ft x 2ft x 3 layers

#### Working with Layers

**Layer 0 (Ground):**
- Heaviest items
- Large amps, drum kits
- Foundation of stack

**Layer 1-2 (Middle):**
- Medium equipment
- Flight cases
- Moderate weight

**Layer 3-4 (Top):**
- Lightweight items
- Cables, small boxes
- Items that won't crush below

**Viewing Layers:**
1. Click layer number in selector
2. Items on that layer shown solid
3. Items on other layers shown faint/outline
4. Multi-layer items show which layers they span

**Multi-Layer Items:**
- Tall items span multiple layers
- Visual indicator shows height
- Example: 3-layer speaker on layer 0 occupies layers 0, 1, 2

#### Collision Detection

**Prevents:**
- Overlapping items on same layer
- Invalid placements

**Visual Feedback:**
- Red outline when collision detected
- Item snaps back if placed in occupied space

**To Resolve:**
- Move item to empty space
- Adjust item dimensions
- Change to different layer

### Managing Stowage Plans

#### Removing Items from Container

1. Click item on canvas
2. Click "Remove from Container"
3. Item returns to staged panel
4. Can be added to different container

#### Clearing Container

**Use Case:** Start over with different packing plan

**Steps:**
1. Click "Clear" on container card
2. Confirm action
3. All items returned to staged panel
4. Container remains for reuse

#### Deleting Container

**Use Case:** No longer needed

**Steps:**
1. Click "Delete" on container card
2. Warning displayed
3. Confirm deletion
4. Container removed
5. Items returned to staged panel

### Printing/Sharing Plans

**Current Methods:**
- Screenshot canvas
- Print browser page (Ctrl+P)
- Share screenshot with loading crew

**Future Features:**
- PDF export
- Print-optimized layout
- Share link to plan

### Best Practices

**Plan Before Loading Day:**
- Create containers in advance
- Test different packing layouts
- Optimize for:
  - Weight distribution
  - Access order (what unloads first)
  - Fragile item protection

**Use Realistic Dimensions:**
- Measure actual gear
- Account for cases/padding
- Leave space for straps/securing

**Layer Strategically:**
- Heavy items on bottom
- Fragile items on top or secured
- Frequently accessed items near door

**Color Coding:**
- Items color-coded by band
- Easy to see which band's gear where
- Helps with unloading organization

**Mobile Access:**
- View plans on tablet during loading
- Crew can follow visual layout
- No need to memorize

---

## Team Messaging

### Posting Messages

#### When to Post

**Urgent (🚨):**
- Emergencies only
- Lost child
- Severe weather
- Safety issues
- Critical equipment failure

**Alert (⚠️):**
- Missing expensive gear
- Important schedule changes
- Urgent lost property
- Security issues

**Announcement (📢):**
- Schedule updates
- General reminders
- Shift changes
- Important info

**Info (ℹ️):**
- Helpful tips
- Non-urgent updates
- FYI information
- Reminders

#### Posting Process

**Steps:**
1. Click "Messages"
2. Click "Post New Message"
3. Select category (Urgent, Alert, Announcement, Info)
4. Enter message (500 characters max)
5. Optional: Check "Pin to top" for ongoing visibility
6. Click "Post"

**Message Appears:**
- Immediately for all users
- In messages list
- Badge notification on Messages button
- If Urgent: Popup modal for all users

#### Writing Effective Messages

**Be Clear and Concise:**
- State issue/update clearly
- Include relevant details:
  - Band name
  - Item description
  - Location
  - Time
  - Action needed

**Good Examples:**
- "⚠️ ALERT: Guitar for The Rockers (G042) missing. Last seen Main Stage 30 mins ago. Please check storage areas."
- "📢 ANNOUNCEMENT: Loading Dock now open. Truck 1 ready for packing. See stowage plan."
- "ℹ️ INFO: Lunch break 12:00-1:00pm. Scanner stations remain open."

**Bad Examples:**
- "urgent!!!!" (no details)
- "Someone check on something" (too vague)
- "idk what happened but stuff is gone" (unprofessional, unclear)

### Managing Messages

#### Pinning Messages

**When to Pin:**
- Ongoing situations
- Information needed for extended time
- Important reference info

**How:**
1. Click pin icon on message
2. Message moves to top of list
3. Stays pinned until unpinned

**Un-pinning:**
- Click pin icon again
- Message returns to chronological order

#### Deleting Messages

**When to Delete:**
- Typos or errors
- Outdated information
- Resolved situations

**How:**
1. Click delete icon on message
2. Confirm deletion
3. Message removed for all users

**Note:** Cannot edit messages. To fix, delete and repost.

### Urgent Message Behavior

**What Happens:**
- Popup modal appears on screen
- Blocks interaction with app until dismissed
- Dark overlay
- Cannot be ignored

**User Options:**
- "Dismiss" - Mark as read, close popup
- "View All Messages" - Go to messages page

**Auto-Check:**
- System checks for urgent messages every 30 seconds
- If new urgent message, popup appears
- Shows one at a time (oldest first)

**Use Sparingly:**
- Only for true emergencies
- Users cannot work until dismissed
- Overuse = users ignore

### Message Best Practices

**For Admins:**
- Post updates proactively
- Don't wait for users to ask
- Use appropriate category
- Pin important ongoing messages
- Delete resolved situations

**For All:**
- Check messages at start of shift
- Check badge count regularly
- Read urgent messages immediately
- Keep messages professional

---

## Best Practices

### Pre-Festival Setup

**Week Before:**
1. Create all locations
2. Invite all users (give time to sign up)
3. Upload schedule
4. Test bulk upload with sample CSV
5. Print test QR codes (verify readability)

**Day Before:**
6. Bulk register all known gear
7. Assign to "Tags Not Collected"
8. Print all QR codes
9. Organize labels by band
10. Create stowage plans for trucks

**Day Of:**
11. Brief all admins/users on workflow
12. Post welcome message
13. Set up scanning stations
14. Have manual fallback ready (paper)

### During Festival

**Daily Tasks:**
- Post schedule reminders
- Check missing items list
- Monitor status dashboard
- Respond to messages
- Update locations as needed

**Shift Handoffs:**
- Post message about shift change
- Brief incoming shift
- Point out any issues
- Ensure scanner access

**End of Day:**
- Review missing items
- Post next day schedule
- Charge devices
- Brief night security on system

### Post-Festival

**Immediately After:**
1. Mark all gear as checked out or missing
2. Post final message thanking team
3. Follow up on missing items
4. Export data (CSV backups)

**Week After:**
5. Review what worked well
6. Note improvements for next time
7. Archive festival data
8. Remove users if one-time event

### Data Management

**Regular Backups:**
- No built-in export yet
- Manually screenshot important data
- Copy critical info to spreadsheet
- Firebase console has backup options

**Keeping Clean:**
- Delete test data before festival
- Use descriptive names consistently
- Archive old festivals (future feature)

### Communication

**With Your Team:**
- Train before festival
- Provide quick reference guide
- Assign admin buddy system
- Set expectations for response time

**With Bands:**
- Explain QR code system on arrival
- Emphasize keeping tags on gear
- Provide contact for issues
- Clear checkout process explained

---

## Advanced Tips

### Bulk Operations Efficiency

**Chaining Actions:**
1. Bulk select items
2. Mark in transit
3. (Move physically)
4. Bulk select same items
5. Check in to new location

**Using Filters:**
- Filter by band before bulk select
- Filter by location for batch moves
- Save time with "Select All in Filter"

### CSV Preparation Tips

**Excel to CSV:**
- Use "Save As" → CSV UTF-8
- Avoid special characters
- Check date format (DD-MM-YYYY)
- Remove empty rows

**Band Name Consistency:**
- Use schedule names exactly
- Lowercase doesn't matter (normalized)
- Remove special characters yourself (safer)

**Testing:**
- Test with 5-item CSV first
- Verify before full upload
- Keep original data backed up

### Location Strategy

**Fewer is Better:**
- Don't create 20 locations
- Combine similar areas
- Use 5-10 key locations
- Reduces dropdown clutter

**Color Consistency:**
- Same color for related locations
- "Main Stage" and "Main Stage Storage" both blue
- Visual grouping

### Schedule Integration

**Upload Early:**
- Before bulk gear registration
- Auto-links gear to performances
- Autocomplete works in registration

**Keep Updated:**
- Edit times if changed
- Don't leave old performances

### Stowage Planning

**Start Early:**
- Create plans days before
- Adjust as needed
- Share screenshots with crew

**Realistic Sizes:**
- Measure actual gear
- Err on side of larger
- Account for padding

**Loading Order:**
- Items unloaded first packed last
- Stage 1 gear near door
- Stage 2 gear behind

### Messaging Strategy

**Pre-Write Templates:**
- Common messages saved elsewhere
- Copy/paste when needed
- Consistent format

**Examples:**
- "Lunch break [time]. Scanners remain open."
- "[Band name] [item] missing. Last seen [location] [time]. Check [area]."
- "[Band name] performing in 30 mins. Gear needed at [stage]."

### User Management

**Role Distribution:**
- 1 Owner
- 2-3 Admins (backup)
- Rest as Users
- Don't over-admin (confusion)

**Training:**
- Admins: Full training session
- Users: Quick start guide
- Print cheat sheet
- Assign experienced mentor

### Troubleshooting Access

**If Admin Can't Do Something:**
- Verify role in User Management
- Check browser (try Chrome)
- Clear cache
- Re-login

**If Owner Unavailable:**
- Assign multiple admins (backup)
- Owner should delegate
- Emergency: Contact app support

---

## FAQ for Admins

**Q: Can I undo a bulk delete?**
A: No. Deletion is permanent. Be careful with bulk delete.

**Q: How many locations should I create?**
A: 5-10 is optimal. Cover key areas but don't overdo it.

**Q: Can I edit a message after posting?**
A: No. Delete and repost if needed.

**Q: What if bulk upload fails?**
A: Check CSV format, date format, column names. All-or-nothing import.

**Q: Can users see stowage plans?**
A: Currently no. Admin/Owner only. Share screenshots if needed.

**Q: How do I export data?**
A: No built-in export yet. Manually copy or screenshot.

**Q: Can I have multiple festivals?**
A: Yes (database supports it) but UI doesn't have switcher yet.

**Q: What happens if I delete Owner?**
A: You can't. Owner is protected from deletion.

**Q: Can I transfer ownership?**
A: Not yet (future feature).

**Q: How many users can I invite?**
A: Unlimited (within Firebase limits).

---

## Summary

As an Admin or Owner, you have powerful tools:

- **Bulk operations** for efficiency
- **Location management** for organization
- **Schedule integration** for coordination
- **Stowage planning** for logistics
- **Team messaging** for communication
- **User management** (Owner only) for access control

**Use them wisely:**
- Train your team
- Plan ahead
- Communicate clearly
- Keep data clean
- Test before go-live

For detailed workflows, see `WORKFLOWS.md`
For quick reference, see `QUICK_START.md`
For complete features, see `USER_GUIDE.md`
