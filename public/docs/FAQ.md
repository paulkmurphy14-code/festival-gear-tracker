# Festival Gear Tracker - Frequently Asked Questions (FAQ)

Common questions and answers about using the Festival Gear Tracker system.

## Table of Contents

1. [General Questions](#general-questions)
2. [Getting Started](#getting-started)
3. [QR Code Scanning](#qr-code-scanning)
4. [Gear Management](#gear-management)
5. [Permissions & Roles](#permissions--roles)
6. [Technical Issues](#technical-issues)
7. [Features & Functionality](#features--functionality)
8. [Best Practices](#best-practices)

---

## General Questions

### What is Festival Gear Tracker?

Festival Gear Tracker is a web-based Progressive Web App (PWA) for managing musical equipment at festivals and events. It uses QR codes and real-time tracking to help staff and bands know where gear is at all times.

### Do I need to download an app?

No! It's a web app that works in your browser. You can optionally "install" it to your phone's home screen for quick access, but it's not required.

### Does it work offline?

Yes! Most features work offline including:
- Viewing gear lists
- Scanning QR codes
- Updating gear status
- Viewing schedule

Changes sync automatically when you're back online.

### What doesn't work offline?

- Posting messages
- Inviting users
- Bulk CSV uploads
- Real-time collaboration (changes sync when online)

### Is my data safe?

Yes. Data is stored in Firebase (Google's cloud platform) with security rules that prevent unauthorized access. Only users associated with your festival can see your data.

### Can I use this for non-festival events?

Absolutely! It works for any event with equipment tracking needs:
- Concerts
- Conferences
- Theater productions
- Corporate events
- Trade shows
- Weddings

### How much does it cost?

[Pricing information would go here - currently in trial/development]

### What devices are supported?

- Smartphones (iOS, Android)
- Tablets
- Laptops/desktops
- Any device with a modern web browser and camera (for scanning)

### What browsers work best?

- Chrome (recommended)
- Safari
- Firefox
- Edge

Most modern browsers work, but Chrome offers the best experience.

---

## Getting Started

### How do I create a festival?

1. Sign up with email and password
2. Fill in festival details (name, location, dates)
3. Click "Create Festival"
4. You're automatically assigned as Owner
5. Two default locations are created automatically

### How do I invite my team?

**Single Invite:**
- User Management → Invite User → Enter email and role → Send

**Bulk Invite:**
- Prepare CSV with: Name, Email, Role
- User Management → Bulk Upload CSV → Select file → Confirm

### What's the difference between Admin and User roles?

**Admin can:**
- Upload CSVs
- Manage locations
- Manage schedule
- Delete items
- Post messages
- Stowage planning

**User can:**
- Scan QR codes
- Register single items
- Edit gear
- Change locations
- View everything

### How long does setup take?

- Basic setup: 10-15 minutes
- Complete setup with bulk upload: 1-2 hours
- Including team training: 2-3 hours

### What do I need before starting?

- Band list (if known)
- Gear lists from bands (optional, can register on arrival)
- Performance schedule (optional, can add later)
- Team member email addresses
- QR code printer or regular printer with labels

---

## QR Code Scanning

### Why won't my QR code scan?

**Common causes:**
1. **Camera permissions denied** - Check browser settings, allow camera access
2. **Poor lighting** - Move to brighter area or use device flashlight
3. **Code damaged** - Print new code
4. **Camera dirty** - Clean lens
5. **Code too small** - Print larger size

### Do I need special equipment to scan?

No, just a device with a camera (smartphone or tablet). The app uses your device's built-in camera.

### Can I scan without a camera?

Yes, use manual entry:
- Search for item in Gear List
- Update location manually
- No scanning needed

### What if the QR code gets wet or damaged?

Print a replacement:
- Find item in Gear List
- Click "Print QR Code"
- Print new code
- Attach to item
- Scan to verify

### Can I scan the same item multiple times?

Yes, but there's a 3-second cooldown to prevent accidental duplicate scans.

### What happens when I scan a missing item?

The system automatically:
- Resolves the missing status
- Shows "This item was reported missing! Found!"
- Records who found it and where
- Updates status to active
- Removes from missing count

### Can I scan QR codes displayed on a screen?

Yes, but printed codes work better. Avoid screen glare and ensure code is large enough.

---

## Gear Management

### How do I register gear?

**Single Registration:**
- Click "Register"
- Enter band name
- Add item descriptions (or use Quick Add)
- Select location
- Submit

**Bulk Registration:**
- Prepare CSV: Band Name, Item Description
- Click "Bulk Upload"
- Select file
- Choose location
- Confirm

### Can I edit gear after registering?

Yes! All users can edit:
- Item description
- Band name
- Location

Admin/Owner can also delete items.

### How do I delete an item?

**Single Item (Admin/Owner only):**
- Find item in Gear List
- Click item
- Click "Delete"
- Confirm

**Bulk Delete (Admin/Owner only):**
- Select items (checkboxes)
- Click "Delete Selected"
- Type "DELETE" to confirm
- Items permanently removed

### Can I undo a deletion?

No, deletions are permanent. Be careful!

### What if I register the same item twice?

Delete one of the duplicates:
- Find the duplicate in Gear List
- Delete it (Admin/Owner only)
- Keep the original

### How do I move multiple items at once?

1. Open Gear List
2. Check boxes next to items
3. Click "Change Location" or use filter shortcuts like "Select All in Band"
4. Choose destination
5. Confirm

### What does "In Transit" mean?

Items marked as "In Transit" are currently being moved from one location to another. It's a temporary status to indicate the item is not at a fixed location.

### What's the difference between "Checked Out" and "Check Out to Band"?

They're the same. "Check Out to Band" is the action, "Checked Out" is the resulting status. It means the item is with the band (not in venue custody).

### Can bands see their own gear?

Not directly (no band login). But staff can show them:
- Filter Gear List by band name
- Show on screen or printout
- Or via Schedule → Click performance

---

## Permissions & Roles

### What can regular Users do?

Users can:
- Scan QR codes
- Register single items
- Edit gear details
- Change locations (single or bulk)
- View schedule
- Read messages
- Create personal reminders

Users cannot:
- Delete items
- Upload CSVs
- Manage locations
- Post messages
- Manage users

### What's the difference between Admin and Owner?

**Owner has additional powers:**
- Manage users (invite, remove, change roles)
- Cannot be removed
- Transfer ownership (future feature)

**Admin cannot:**
- Manage users
- Cannot promote/demote anyone

Both can do all gear operations, location management, and messaging.

### Can I have multiple Owners?

No, only one Owner per festival. Owner can assign multiple Admins for backup.

### How do I change someone's role?

**Owner only:**
- User Management → Find user → Edit → Select new role → Save

### Can I remove the Owner?

No, the Owner cannot be removed (prevents lockout). You must contact support to transfer ownership.

### What if the Owner leaves?

Contact app support to transfer ownership to another team member. Cannot be done within the app (security measure).

### Can someone be both Admin and User at the same time?

No, you have one role. Admin includes all User permissions plus additional powers.

---

## Technical Issues

### Changes aren't appearing for other users

**Possible causes:**
1. **Not synced yet** - Wait up to 60 seconds
2. **Offline** - Check network connection
3. **Need refresh** - Reload page (F5 or pull down)

### I can't access a feature

**Check your role:**
- Some features require Admin or Owner role
- User Management shows your current role
- Ask Owner to promote you if needed

### The app is slow

**Try:**
1. Refresh page
2. Clear browser cache
3. Close other apps/tabs
4. Check internet speed
5. Use filters to reduce visible items (if large gear list)

### I can't log in

**Check:**
1. Email and password correct
2. Account exists (did you sign up?)
3. Using correct browser
4. Clear browser cache
5. Try "Forgot Password"

### Items are duplicated in the list

**Cause:** Might have registered same item twice

**Solution:**
- Delete duplicate (Admin/Owner only)
- Keep original

### Location colors aren't showing

**Try:**
1. Refresh page
2. Clear browser cache
3. Check if location has color assigned

### QR codes won't print

**Check:**
1. Printer connected
2. Browser print settings
3. Popup blocker (allow popups)
4. Try different browser
5. Save as PDF first, then print PDF

### I see an error message

**Common errors:**

**"Missing or insufficient permissions"**
- Check your role (might need Admin)
- Owner might need to assign permissions
- Check Firebase security rules

**"Network error"**
- Check internet connection
- Wait and try again
- Changes queue offline and sync later

**"Invalid format"**
- CSV format incorrect
- Check column names and order
- Ensure dates are DD-MM-YYYY
- Ensure times are HH:MM

---

## Features & Functionality

### Can I export data?

Currently no built-in export. Future feature planned.

**Workaround:**
- Screenshot important data
- Manually copy to spreadsheet
- Firebase console has backup options (technical)

### Can I print reports?

Not currently. You can:
- Print gear list page (browser print)
- Screenshot dashboard
- Copy data to create your own reports

### Can I track individual components (e.g., each drum in a drum kit)?

Yes! Register each component separately:
- Drum Kit - Bass Drum
- Drum Kit - Snare
- Drum Kit - Tom 1
- Drum Kit - Tom 2

Or register as single item "Drum Kit" if tracking together.

### Can I attach photos to gear items?

Not currently. Future feature consideration.

**Workaround:**
- Use descriptive text
- Keep photos separately
- Reference in description

### Can I set alerts for specific times?

Not automatic alerts. Use Personal Reminders:
- Set due date/time
- Link to gear or band
- Check reminders regularly

### Can bands access the system?

Not currently - no band-specific login.

**Workaround:**
- Show band their gear list on your device
- Print gear list for band
- Email screenshot of their gear status

### Can I create custom fields?

No, fields are fixed. You can use the description field for additional info.

### Does it integrate with other software?

Not currently. It's a standalone system.

### Can I use barcodes instead of QR codes?

No, system uses QR codes only. QR codes are:
- Easier to scan
- More data storage
- Better for phones
- More robust (work even if partially damaged)

### Can multiple people scan at the same time?

Yes! Unlimited concurrent users. Each scan syncs independently.

### How many festivals can I manage?

Database supports multiple festivals per user, but UI doesn't have festival switcher yet. Each festival is separate.

### Can I copy gear from a previous festival?

Not currently (future feature).

**Workaround:**
- Export previous festival data (CSV)
- Re-upload to new festival
- Or manually register if small list

---

## Best Practices

### When should I register gear?

**Best practice:** Before festival starts (bulk upload)

**Alternative:** As bands arrive (on-the-spot registration)

**Hybrid:** Pre-register known bands, register walk-ins on arrival

### How often should I scan gear?

**At every location change:**
- Checking into storage
- Moving to stage
- Checking out to band

**More scans = better tracking**

### Should I use In Transit status?

**Yes, if:**
- Moving gear takes significant time
- Want to show gear is in motion
- Coordinating between multiple people

**No, if:**
- Moving quickly
- Just scan at destination
- Simple/fast movements

### How many locations should I create?

**Optimal:** 5-10 locations

**Include:**
- Each stage (Main Stage, Acoustic Stage, etc.)
- Storage area(s)
- Registration area
- Loading dock
- Special areas (Repair, Lost & Found)

**Avoid:** 20+ locations (too much, confusing)

### Should I delete or check out gear at end of festival?

**Check out to band** (recommended)
- Keeps record
- Shows gear returned
- Audit trail
- Can see total checked out

**Delete** (not recommended unless necessary)
- Permanent removal
- Loses history
- Use only for errors/duplicates

### How do I organize storage?

**Physical:**
- Group by band
- Use color coding (matches app)
- Label areas
- Keep high-value items secure

**In App:**
- Use descriptive location names
- Scan items into specific storage location
- Use stowage planning for containers

### Should I print QR codes in advance?

**Yes, if:**
- You pre-registered gear
- Bands confirmed attendance
- Gear list is stable

**No, if:**
- High uncertainty
- Many walk-in bands
- Gear list changes frequently

**Compromise:**
- Print for confirmed bands
- Print on-demand for others

### How do I train my team?

**Before Festival:**
- Send Quick Start Guide
- Hold 30-minute training session
- Let them practice with test items
- Assign experienced mentor

**Day Of:**
- Quick refresher
- Provide cheat sheet
- Designate "expert" users
- Be available for questions

### What if I make a mistake?

**Wrong location:** Just update to correct location

**Duplicate registration:** Delete duplicate (Admin/Owner)

**Wrong band name:** Edit gear item, change band

**Deleted by accident:** Cannot undo, must re-register

**Wrong status:** Scan or update to correct status

---

## Specific Scenarios

### What if a band never shows up?

**Option 1:** Leave gear registered (shows in system)
- Mark as "Checked Out" (even though band not there)
- Keeps record for next year

**Option 2:** Delete gear (Admin/Owner)
- Removes from system
- Cleaner active list

**Option 3:** Create "No Show" location
- Move gear there
- Clear distinction

### What if a band brings extra gear not registered?

**Register it:**
- Click "Register"
- Add new items
- Print QR codes
- Attach and scan

Takes 2-5 minutes.

### What if I run out of QR code labels?

**Options:**
1. Print on regular paper, attach with clear tape
2. Use manual entry (no codes)
3. Print larger codes, cut down
4. Get more labels (keep extras on hand)

### What if two bands have the same name?

**Disambiguate:**
- "The Rockers (USA)"
- "The Rockers (UK)"
- "The Rockers 1"
- "The Rockers 2"

System normalizes band names, so any unique identifier works.

### What if gear is moved without being scanned?

**It happens!**
- Check last known location
- Ask around
- Update location manually when found
- Emphasize scanning to team

### What if someone scans the wrong item?

**No problem:**
- Scan again with correct location
- Or update manually
- Latest scan is current status
- Scan history shows all movements

### What if the internet goes down during the event?

**System continues working:**
- All scans save locally
- All updates queue
- When internet back, auto-sync
- No data loss

**Can't do:**
- Post new messages
- Invite users
- Bulk uploads

---

## Troubleshooting Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Can't scan QR code | Check camera permissions, lighting, clean lens |
| Changes not appearing | Wait 60 seconds, refresh page |
| Can't delete item | Check if you're Admin/Owner |
| Items duplicated | Delete duplicate (Admin/Owner only) |
| Can't log in | Check email/password, try password reset |
| Slow performance | Refresh page, clear cache, use filters |
| QR code damaged | Print replacement from Gear List |
| Item missing | Report Missing, alert team, systematic search |
| Can't access feature | Check your role (User vs Admin vs Owner) |
| CSV won't upload | Check format, column names, date format |
| Offline mode | Most features work, sync when back online |
| Missing email invitation | Check spam, resend invitation |
| Wrong location shown | Update manually or scan again |
| Want to undo deletion | Can't undo, must re-register |

---

## Getting Help

### Where can I learn more?

**Documentation:**
- `USER_GUIDE.md` - Complete feature reference
- `QUICK_START.md` - Get started in 5 minutes
- `ADMIN_GUIDE.md` - Admin/Owner features
- `WORKFLOWS.md` - Step-by-step scenarios

### Who do I contact for support?

**Your Festival:**
- Contact your festival Owner or Admin
- Check Messages for team announcements

**Technical Support:**
[Support contact information would go here]

### How do I report a bug?

[Bug reporting process would go here]

### How do I request a new feature?

[Feature request process would go here]

### Is there a community forum?

[Community information would go here]

---

## Feature Requests & Known Limitations

### What features are coming soon?

**Planned features:**
- Data export (CSV, PDF)
- Push notifications
- Barcode support
- Photo attachments
- Advanced reporting
- Multi-festival UI switcher
- Gear archiving

### What are current limitations?

**Known limitations:**
- No built-in export
- No push notifications
- No message editing (delete and repost)
- No undo for deletions
- No gear archiving
- No band login portal
- No automatic alerts

### Can I suggest a feature?

Yes! [Process for suggestions would go here]

---

## Quick Tips

**For Everyone:**
- Scan often (keeps status current)
- Check Messages daily
- Use search if can't scan
- Report problems immediately

**For Admins:**
- Print QR codes immediately after registration
- Use bulk operations for efficiency
- Post updates proactively
- Train your team well

**For Owners:**
- Set up early (week before)
- Assign multiple admins (backup)
- Test the system before go-live
- Keep user list updated

---

**Still have questions?**

Check the full documentation in `USER_GUIDE.md` or contact your festival administrator.
