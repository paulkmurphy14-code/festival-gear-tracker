\## \*\*📨 OFFLINE MESSAGING SYSTEM - COMPLETE SPECIFICATION\*\*



---



\## \*\*🎯 OVERVIEW\*\*



Create a broadcast messaging system where admins post announcements that all users can read. Messages stored in Firestore with offline support, accessible via dedicated Messages page with notification badge. Zero UI disruption - no automatic banners.



---



\## \*\*🗄️ DATABASE STRUCTURE\*\*



\### \*\*New Collection: `festivals/{festivalId}/messages`\*\*



```javascript

{

&nbsp; id: "msg\_abc123",                    // Auto-generated

&nbsp; category: "urgent" | "announcement" | "info" | "alert",

&nbsp; content: "Stage 2 running 30 minutes behind schedule.",

&nbsp; author\_name: "Sarah Connor",         // Display name

&nbsp; author\_email: "sarah@festival.com",  // User email

&nbsp; created\_at: timestamp,               // When posted

&nbsp; pinned: false,                       // Pin to top

&nbsp; pinned\_at: timestamp | null          // When pinned

}

```



\*\*Category Types:\*\*

\- `urgent` 🚨 - Emergencies, critical delays

\- `announcement` 📢 - General updates

\- `info` ℹ️ - Helpful information

\- `alert` ⚠️ - Lost property, issues



---



\### \*\*New Collection: `festivals/{festivalId}/message\_reads`\*\*



\*\*Purpose:\*\* Track which messages each user has read



```javascript

{

&nbsp; id: "read\_xyz789",           // Auto-generated

&nbsp; user\_id: "user\_abc123",      // User UID

&nbsp; message\_id: "msg\_abc123",    // Message ID

&nbsp; read\_at: timestamp           // When read

}

```



\*\*Alternative Structure (Simpler):\*\*

```javascript

// Store as subcollection under user

festivals/{festivalId}/users/{userId}/read\_messages/{messageId}

{

&nbsp; read\_at: timestamp

}

```



\*\*My Recommendation:\*\* Use subcollection structure - easier queries per user



---



\## \*\*🎨 UI IMPLEMENTATION\*\*



\### \*\*1. HOME PAGE - Messages Button\*\*



\*\*Update App.jsx home button grid:\*\*



\*\*CURRENT (5 buttons visible to all):\*\*

```

\[Scan QR]    \[Register]

\[Gear List]  \[Schedule]

\[Bulk Upload]\* \[Locations]\*

```



\*\*NEW (6 buttons - reorganize):\*\*

```

\[Scan QR]      \[Register]

\[Gear List]    \[Schedule]  

\[Messages]     \[Bulk Upload]\* or \[Locations]\*

```



\*\*For regular users (5 buttons):\*\*

```

\[Scan QR]      \[Register]

\[Gear List]    \[Schedule]  

\[Messages]     

```



\*\*For admin/owner (6 buttons):\*\*

```

\[Scan QR]      \[Register]

\[Gear List]    \[Schedule]  

\[Messages]     \[Locations]

&nbsp;                OR

&nbsp;              \[Bulk Upload]

```



\*\*Actually, let me reconsider - 7 buttons for admin:\*\*

```

\[Scan QR]      \[Register]    \[Bulk Upload]\*

\[Gear List]    \[Schedule]    \[Locations]\*

\[Messages]     

```



\*\*Visual with notification badge:\*\*

```

┌─────────────────────────────────────────┐

│ \[📷 Scan QR]     \[➕ Register]         │

│    Check In          Add Gear           │

│                                         │

│ \[📋 Gear List]   \[📅 Schedule]         │

│    View All          Performances       │

│                                         │

│ \[📨 Messages]    \[📦 Bulk Upload]\*     │

│    🔴 2 NEW          CSV Import         │

│                                         │

│ \[📍 Locations]\*                         │

│    Manage                               │

└─────────────────────────────────────────┘

```



\*\*Badge Styling:\*\*

```javascript

// Red dot with count

style={{

&nbsp; position: 'absolute',

&nbsp; top: '8px',

&nbsp; right: '8px',

&nbsp; background: '#f44336',

&nbsp; color: 'white',

&nbsp; borderRadius: '12px',

&nbsp; padding: '4px 8px',

&nbsp; fontSize: '11px',

&nbsp; fontWeight: '700',

&nbsp; minWidth: '20px',

&nbsp; textAlign: 'center',

&nbsp; boxShadow: '0 2px 6px rgba(244,67,54,0.4)'

}}

```



---



\### \*\*2. MESSAGES PAGE - Full Layout\*\*



```

┌─────────────────────────────────────────┐

│ Festival Gear Tracker                   │

│ Organising Chaos Like a Pro            │

├─────────────────────────────────────────┤

│ Active: 18  Transit: 3  Checked Out: 3 │

├─────────────────────────────────────────┤

│                                         │

│ 📨 Messages                             │

│                                         │

│ {isAdminOrOwner \&\& (                    │

│   \[+ Post New Message]                  │

│ )}                                      │

│                                         │

│ {messages.length === 0 ? (              │

│   <EmptyState />                        │

│ ) : (                                   │

│   <MessageList />                       │

│ )}                                      │

│                                         │

│ \[← Back to Home]                        │

└─────────────────────────────────────────┘

```



---



\### \*\*3. MESSAGE CARD - Individual Message\*\*



```

┌─────────────────────────────────────────┐

│ 📌 🚨 URGENT                     • NEW  │

│                                         │

│ Stage 2 running 30 minutes behind       │

│ schedule. All performances shifted      │

│ accordingly. Check updated times.       │

│                                         │

│ Sarah Connor • 12:45 PM                 │

│                                         │

│ {isAdminOrOwner \&\& (                    │

│   \[Unpin] \[Delete]                      │

│ )}                                      │

└─────────────────────────────────────────┘

```



\*\*Styling by Category:\*\*



\*\*URGENT (Red):\*\*

```javascript

{

&nbsp; background: 'rgba(244, 67, 54, 0.15)',

&nbsp; border: '2px solid #f44336',

&nbsp; borderLeft: '4px solid #f44336'

}

```



\*\*ANNOUNCEMENT (Orange):\*\*

```javascript

{

&nbsp; background: 'rgba(255, 165, 0, 0.15)',

&nbsp; border: '2px solid #ffa500',

&nbsp; borderLeft: '4px solid #ffa500'

}

```



\*\*INFO (Blue):\*\*

```javascript

{

&nbsp; background: 'rgba(33, 150, 243, 0.15)',

&nbsp; border: '2px solid #2196f3',

&nbsp; borderLeft: '4px solid #2196f3'

}

```



\*\*ALERT (Yellow):\*\*

```javascript

{

&nbsp; background: 'rgba(255, 193, 7, 0.15)',

&nbsp; border: '2px solid #ffc107',

&nbsp; borderLeft: '4px solid #ffc107'

}

```



---



\### \*\*4. POST MESSAGE MODAL\*\*



```

┌─────────────────────────────────────────┐

│ Post New Message                        │

├─────────────────────────────────────────┤

│                                         │

│ Category \*                              │

│ ┌─────────────────────────────────────┐│

│ │ 🚨 URGENT                      ▼   ││

│ └─────────────────────────────────────┘│

│   Options:                              │

│   🚨 URGENT - Critical updates          │

│   📢 ANNOUNCEMENT - General info        │

│   ℹ️ INFO - Helpful details            │

│   ⚠️ ALERT - Issues, lost property     │

│                                         │

│ Message \* (500 characters max)          │

│ ┌─────────────────────────────────────┐│

│ │                                     ││

│ │                                     ││

│ │                                     ││

│ │                                     ││

│ └─────────────────────────────────────┘│

│ 437 characters remaining                │

│                                         │

│ ☐ Pin to top of messages list          │

│   (Pinned messages stay at top)        │

│                                         │

│ \[Post Message] \[Cancel]                 │

└─────────────────────────────────────────┘

```



\*\*Validation:\*\*

\- Category: Required

\- Message: Required, 1-500 characters

\- No empty/whitespace-only messages



---



\### \*\*5. EMPTY STATE\*\*



```

┌─────────────────────────────────────────┐

│                                         │

│              📨                         │

│                                         │

│         No Messages Yet                 │

│                                         │

│  {isAdminOrOwner ? (                    │

│    "Post your first message to          │

│     communicate with your team."        │

│                                         │

│    \[+ Post New Message]                 │

│  ) : (                                  │

│    "No messages from admins yet.        │

│     Check back later for updates."      │

│  )}                                     │

│                                         │

└─────────────────────────────────────────┘

```



---



\## \*\*🔧 FUNCTIONALITY IMPLEMENTATION\*\*



\### \*\*1. Load Messages\*\*



\*\*On Messages page load:\*\*

```javascript

const loadMessages = useCallback(async () => {

&nbsp; if (!db) return;

&nbsp; 

&nbsp; try {

&nbsp;   const msgs = await db.messages.toArray();

&nbsp;   

&nbsp;   // Sort: Pinned first (by pinned\_at desc), then by created\_at desc

&nbsp;   const sorted = msgs.sort((a, b) => {

&nbsp;     if (a.pinned \&\& !b.pinned) return -1;

&nbsp;     if (!a.pinned \&\& b.pinned) return 1;

&nbsp;     if (a.pinned \&\& b.pinned) {

&nbsp;       return b.pinned\_at.toMillis() - a.pinned\_at.toMillis();

&nbsp;     }

&nbsp;     return b.created\_at.toMillis() - a.created\_at.toMillis();

&nbsp;   });

&nbsp;   

&nbsp;   setMessages(sorted);

&nbsp;   

&nbsp;   // Mark all as read when page opens

&nbsp;   await markAllAsRead(sorted);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error loading messages:', error);

&nbsp; }

}, \[db]);

```



---



\### \*\*2. Calculate Unread Count\*\*



\*\*For home page badge:\*\*

```javascript

const loadUnreadCount = useCallback(async () => {

&nbsp; if (!db || !currentUser) return;

&nbsp; 

&nbsp; try {

&nbsp;   // Get all messages

&nbsp;   const allMessages = await db.messages.toArray();

&nbsp;   

&nbsp;   // Get read messages for current user

&nbsp;   const readMessages = await db.message\_reads

&nbsp;     .where('user\_id', '==', currentUser.uid)

&nbsp;     .toArray();

&nbsp;   

&nbsp;   const readMessageIds = new Set(readMessages.map(r => r.message\_id));

&nbsp;   

&nbsp;   // Count unread

&nbsp;   const unreadCount = allMessages.filter(

&nbsp;     msg => !readMessageIds.has(msg.id)

&nbsp;   ).length;

&nbsp;   

&nbsp;   setUnreadCount(unreadCount);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error loading unread count:', error);

&nbsp; }

}, \[db, currentUser]);

```



\*\*Call on App.jsx mount and when returning from Messages page\*\*



---



\### \*\*3. Mark Messages as Read\*\*



\*\*When user opens Messages page:\*\*

```javascript

const markAllAsRead = async (messages) => {

&nbsp; if (!currentUser) return;

&nbsp; 

&nbsp; try {

&nbsp;   for (const msg of messages) {

&nbsp;     // Check if already read

&nbsp;     const existingRead = await db.message\_reads

&nbsp;       .where('user\_id', '==', currentUser.uid)

&nbsp;       .where('message\_id', '==', msg.id)

&nbsp;       .toArray();

&nbsp;     

&nbsp;     if (existingRead.length === 0) {

&nbsp;       // Mark as read

&nbsp;       await db.message\_reads.add({

&nbsp;         user\_id: currentUser.uid,

&nbsp;         message\_id: msg.id,

&nbsp;         read\_at: new Date()

&nbsp;       });

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   // Update unread count

&nbsp;   setUnreadCount(0);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error marking messages as read:', error);

&nbsp; }

};

```



---



\### \*\*4. Post New Message\*\*



\*\*Admin posts message:\*\*

```javascript

const handlePostMessage = async (formData) => {

&nbsp; if (!formData.category || !formData.content.trim()) {

&nbsp;   setError('Category and message are required');

&nbsp;   return;

&nbsp; }

&nbsp; 

&nbsp; if (formData.content.length > 500) {

&nbsp;   setError('Message cannot exceed 500 characters');

&nbsp;   return;

&nbsp; }

&nbsp; 

&nbsp; try {

&nbsp;   const messageData = {

&nbsp;     category: formData.category,

&nbsp;     content: formData.content.trim(),

&nbsp;     author\_name: currentUser.displayName || currentUser.email,

&nbsp;     author\_email: currentUser.email,

&nbsp;     created\_at: new Date(),

&nbsp;     pinned: formData.pinned || false,

&nbsp;     pinned\_at: formData.pinned ? new Date() : null

&nbsp;   };

&nbsp;   

&nbsp;   await db.messages.add(messageData);

&nbsp;   

&nbsp;   setMessage('✓ Message posted successfully');

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   

&nbsp;   setShowPostModal(false);

&nbsp;   loadMessages();

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error posting message:', error);

&nbsp;   setError('Failed to post message');

&nbsp; }

};

```



---



\### \*\*5. Pin/Unpin Message\*\*



\*\*Admin pins message:\*\*

```javascript

const handleTogglePin = async (messageId, currentlyPinned) => {

&nbsp; try {

&nbsp;   await db.messages.update(messageId, {

&nbsp;     pinned: !currentlyPinned,

&nbsp;     pinned\_at: !currentlyPinned ? new Date() : null

&nbsp;   });

&nbsp;   

&nbsp;   setMessage(currentlyPinned ? '✓ Message unpinned' : '✓ Message pinned to top');

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   

&nbsp;   loadMessages();

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error toggling pin:', error);

&nbsp;   alert('Failed to update message');

&nbsp; }

};

```



---



\### \*\*6. Delete Message\*\*



\*\*Admin deletes message:\*\*

```javascript

const handleDeleteMessage = async (messageId) => {

&nbsp; const confirmed = window.confirm(

&nbsp;   'Are you sure you want to delete this message?\\n\\nThis cannot be undone.'

&nbsp; );

&nbsp; 

&nbsp; if (!confirmed) return;

&nbsp; 

&nbsp; try {

&nbsp;   // Delete the message

&nbsp;   await db.messages.delete(messageId);

&nbsp;   

&nbsp;   // Delete all read records for this message

&nbsp;   const readRecords = await db.message\_reads

&nbsp;     .where('message\_id', '==', messageId)

&nbsp;     .toArray();

&nbsp;   

&nbsp;   for (const record of readRecords) {

&nbsp;     await db.message\_reads.delete(record.id);

&nbsp;   }

&nbsp;   

&nbsp;   setMessage('✓ Message deleted');

&nbsp;   setTimeout(() => setMessage(''), 3000);

&nbsp;   

&nbsp;   loadMessages();

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error deleting message:', error);

&nbsp;   alert('Failed to delete message');

&nbsp; }

};

```



---



\## \*\*📱 COMPONENT STRUCTURE\*\*



\### \*\*File: `/src/components/Messages.jsx`\*\*



\*\*State Variables:\*\*

```javascript

const \[messages, setMessages] = useState(\[]);

const \[showPostModal, setShowPostModal] = useState(false);

const \[postForm, setPostForm] = useState({

&nbsp; category: 'announcement',

&nbsp; content: '',

&nbsp; pinned: false

});

const \[message, setMessage] = useState('');

const \[error, setError] = useState('');

const \[loading, setLoading] = useState(true);

```



\*\*Helper Functions:\*\*

```javascript

const { isAdminOrOwner } = useRole();

const { currentUser } = useAuth();

const db = useDatabase();



const loadMessages = useCallback(async () => { /\* ... \*/ });

const markAllAsRead = async (messages) => { /\* ... \*/ };

const handlePostMessage = async (formData) => { /\* ... \*/ };

const handleTogglePin = async (messageId, isPinned) => { /\* ... \*/ };

const handleDeleteMessage = async (messageId) => { /\* ... \*/ };

const getCategoryIcon = (category) => { /\* ... \*/ };

const getCategoryColor = (category) => { /\* ... \*/ };

const formatTimestamp = (timestamp) => { /\* ... \*/ };

```



---



\### \*\*Update: App.jsx\*\*



\*\*Add unread count state:\*\*

```javascript

const \[unreadMessagesCount, setUnreadMessagesCount] = useState(0);

```



\*\*Add Messages button to home:\*\*

```javascript

<div style={styles.homeButton} onClick={() => setActiveTab('messages')}>

&nbsp; <span style={styles.homeButtonIcon}>📨</span>

&nbsp; <div style={styles.homeButtonText}>Messages</div>

&nbsp; <div style={styles.homeButtonDesc}>Updates</div>

&nbsp; {unreadMessagesCount > 0 \&\& (

&nbsp;   <div style={styles.notificationBadge}>

&nbsp;     {unreadMessagesCount}

&nbsp;   </div>

&nbsp; )}

</div>

```



\*\*Badge styling:\*\*

```javascript

notificationBadge: {

&nbsp; position: 'absolute',

&nbsp; top: '8px',

&nbsp; right: '8px',

&nbsp; background: '#f44336',

&nbsp; color: 'white',

&nbsp; borderRadius: '12px',

&nbsp; padding: '4px 8px',

&nbsp; fontSize: '11px',

&nbsp; fontWeight: '700',

&nbsp; minWidth: '20px',

&nbsp; textAlign: 'center',

&nbsp; boxShadow: '0 2px 6px rgba(244,67,54,0.4)'

}

```



\*\*Add Messages route:\*\*

```javascript

{activeTab === 'messages' \&\& (

&nbsp; <div>

&nbsp;   <Messages />

&nbsp;   <button

&nbsp;     onClick={() => {

&nbsp;       setActiveTab('home');

&nbsp;       loadUnreadCount(); // Refresh count

&nbsp;     }}

&nbsp;     style={{

&nbsp;       marginTop: '20px',

&nbsp;       width: '100%',

&nbsp;       padding: '16px',

&nbsp;       background: '#2d2d2d',

&nbsp;       color: '#ffa500',

&nbsp;       border: '2px solid #ffa500',

&nbsp;       borderRadius: '6px',

&nbsp;       cursor: 'pointer',

&nbsp;       fontSize: '14px',

&nbsp;       fontWeight: '700',

&nbsp;       textTransform: 'uppercase',

&nbsp;       letterSpacing: '1px'

&nbsp;     }}

&nbsp;   >

&nbsp;     Back to Home

&nbsp;   </button>

&nbsp; </div>

)}

```



\*\*Load unread count:\*\*

```javascript

const loadUnreadCount = useCallback(async () => {

&nbsp; // Implementation above

}, \[db, currentUser]);



useEffect(() => {

&nbsp; loadUnreadCount();

&nbsp; const interval = setInterval(loadUnreadCount, 60000); // Check every minute

&nbsp; return () => clearInterval(interval);

}, \[loadUnreadCount]);

```



---



\## \*\*🎨 COMPLETE STYLING\*\*



```javascript

const styles = {

&nbsp; // Messages Page

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

&nbsp; postButton: {

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

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; // Message Card

&nbsp; messageCard: (category, isPinned) => ({

&nbsp;   padding: '16px',

&nbsp;   marginBottom: '12px',

&nbsp;   background: getCategoryBg(category),

&nbsp;   border: `2px solid ${getCategoryBorder(category)}`,

&nbsp;   borderLeft: `4px solid ${getCategoryBorder(category)}`,

&nbsp;   borderRadius: '6px',

&nbsp;   position: 'relative'

&nbsp; }),

&nbsp; 

&nbsp; messageHeader: {

&nbsp;   display: 'flex',

&nbsp;   justifyContent: 'space-between',

&nbsp;   alignItems: 'center',

&nbsp;   marginBottom: '12px'

&nbsp; },

&nbsp; 

&nbsp; messageCategory: (category) => ({

&nbsp;   display: 'flex',

&nbsp;   alignItems: 'center',

&nbsp;   gap: '8px',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '700',

&nbsp;   color: getCategoryColor(category),

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; }),

&nbsp; 

&nbsp; newBadge: {

&nbsp;   background: '#f44336',

&nbsp;   color: 'white',

&nbsp;   padding: '4px 8px',

&nbsp;   borderRadius: '4px',

&nbsp;   fontSize: '10px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; pinIcon: {

&nbsp;   fontSize: '14px',

&nbsp;   color: '#ffa500',

&nbsp;   marginRight: '8px'

&nbsp; },

&nbsp; 

&nbsp; messageContent: {

&nbsp;   fontSize: '14px',

&nbsp;   color: '#e0e0e0',

&nbsp;   lineHeight: '1.6',

&nbsp;   marginBottom: '12px',

&nbsp;   whiteSpace: 'pre-wrap'

&nbsp; },

&nbsp; 

&nbsp; messageFooter: {

&nbsp;   display: 'flex',

&nbsp;   justifyContent: 'space-between',

&nbsp;   alignItems: 'center',

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888'

&nbsp; },

&nbsp; 

&nbsp; messageAuthor: {

&nbsp;   fontWeight: '600',

&nbsp;   color: '#ccc'

&nbsp; },

&nbsp; 

&nbsp; messageTime: {

&nbsp;   color: '#666'

&nbsp; },

&nbsp; 

&nbsp; messageActions: {

&nbsp;   display: 'flex',

&nbsp;   gap: '8px',

&nbsp;   marginTop: '12px'

&nbsp; },

&nbsp; 

&nbsp; actionButton: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ffa500',

&nbsp;   border: '1px solid #ffa500',

&nbsp;   borderRadius: '4px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '600',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; deleteButton: {

&nbsp;   padding: '8px 12px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ff6b6b',

&nbsp;   border: '1px solid #ff6b6b',

&nbsp;   borderRadius: '4px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '12px',

&nbsp;   fontWeight: '600',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '0.5px'

&nbsp; },

&nbsp; 

&nbsp; // Post Modal

&nbsp; modalOverlay: {

&nbsp;   position: 'fixed',

&nbsp;   top: 0,

&nbsp;   left: 0,

&nbsp;   right: 0,

&nbsp;   bottom: 0,

&nbsp;   background: 'rgba(0,0,0,0.8)',

&nbsp;   zIndex: 1000,

&nbsp;   display: 'flex',

&nbsp;   alignItems: 'center',

&nbsp;   justifyContent: 'center',

&nbsp;   padding: '20px'

&nbsp; },

&nbsp; 

&nbsp; modalCard: {

&nbsp;   background: '#2d2d2d',

&nbsp;   borderRadius: '8px',

&nbsp;   padding: '24px',

&nbsp;   maxWidth: '500px',

&nbsp;   width: '100%',

&nbsp;   border: '2px solid #ffa500'

&nbsp; },

&nbsp; 

&nbsp; modalTitle: {

&nbsp;   fontSize: '18px',

&nbsp;   color: '#ffa500',

&nbsp;   fontWeight: '700',

&nbsp;   marginBottom: '20px',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

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

&nbsp; select: {

&nbsp;   width: '100%',

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '4px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   backgroundColor: '#1a1a1a',

&nbsp;   color: '#e0e0e0'

&nbsp; },

&nbsp; 

&nbsp; textarea: {

&nbsp;   width: '100%',

&nbsp;   padding: '12px',

&nbsp;   fontSize: '14px',

&nbsp;   borderRadius: '4px',

&nbsp;   border: '2px solid #3a3a3a',

&nbsp;   backgroundColor: '#1a1a1a',

&nbsp;   color: '#e0e0e0',

&nbsp;   minHeight: '120px',

&nbsp;   resize: 'vertical',

&nbsp;   fontFamily: 'inherit',

&nbsp;   lineHeight: '1.5'

&nbsp; },

&nbsp; 

&nbsp; charCount: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888',

&nbsp;   marginTop: '4px',

&nbsp;   textAlign: 'right'

&nbsp; },

&nbsp; 

&nbsp; checkbox: {

&nbsp;   display: 'flex',

&nbsp;   alignItems: 'center',

&nbsp;   gap: '8px',

&nbsp;   cursor: 'pointer'

&nbsp; },

&nbsp; 

&nbsp; checkboxInput: {

&nbsp;   width: '18px',

&nbsp;   height: '18px',

&nbsp;   accentColor: '#ffa500',

&nbsp;   cursor: 'pointer'

&nbsp; },

&nbsp; 

&nbsp; checkboxLabel: {

&nbsp;   fontSize: '13px',

&nbsp;   color: '#ccc',

&nbsp;   cursor: 'pointer'

&nbsp; },

&nbsp; 

&nbsp; modalButtons: {

&nbsp;   display: 'flex',

&nbsp;   gap: '10px',

&nbsp;   marginTop: '24px'

&nbsp; },

&nbsp; 

&nbsp; submitButton: {

&nbsp;   flex: 1,

&nbsp;   padding: '14px',

&nbsp;   background: '#ffa500',

&nbsp;   color: '#1a1a1a',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; cancelButton: {

&nbsp;   flex: 1,

&nbsp;   padding: '14px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ffa500',

&nbsp;   border: '2px solid #ffa500',

&nbsp;   borderRadius: '6px',

&nbsp;   cursor: 'pointer',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px'

&nbsp; },

&nbsp; 

&nbsp; // Empty State

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

&nbsp;   marginBottom: '24px',

&nbsp;   lineHeight: '1.6'

&nbsp; }

};



// Helper functions for category styling

const getCategoryBg = (category) => {

&nbsp; const colors = {

&nbsp;   urgent: 'rgba(244, 67, 54, 0.15)',

&nbsp;   announcement: 'rgba(255, 165, 0, 0.15)',

&nbsp;   info: 'rgba(33, 150, 243, 0.15)',

&nbsp;   alert: 'rgba(255, 193, 7, 0.15)'

&nbsp; };

&nbsp; return colors\[category] || colors.info;

};



const getCategoryBorder = (category) => {

&nbsp; const colors = {

&nbsp;   urgent: '#f44336',

&nbsp;   announcement: '#ffa500',

&nbsp;   info: '#2196f3',

&nbsp;   alert: '#ffc107'

&nbsp; };

&nbsp; return colors\[category] || colors.info;

};



const getCategoryColor = (category) => {

&nbsp; const colors = {

&nbsp;   urgent: '#ff6b6b',

&nbsp;   announcement: '#ffa500',

&nbsp;   info: '#64b5f6',

&nbsp;   alert: '#ffeb3b'

&nbsp; };

&nbsp; return colors\[category] || colors.info;

};



const getCategoryIcon = (category) => {

&nbsp; const icons = {

&nbsp;   urgent: '🚨',

&nbsp;   announcement: '📢',

&nbsp;   info: 'ℹ️',

&nbsp;   alert: '⚠️'

&nbsp; };

&nbsp; return icons\[category] || icons.info;

};

```



---



\## \*\*🧪 TESTING CHECKLIST\*\*



\### \*\*Basic Functionality\*\*

\- \[ ] Admin can post message

\- \[ ] Message appears in list immediately

\- \[ ] All users can see messages

\- \[ ] Unread badge appears on home button

\- \[ ] Badge shows correct count

\- \[ ] Opening Messages page marks all as read

\- \[ ] Badge disappears when all read

\- \[ ] Returning to home updates badge



\### \*\*Message Actions\*\*

\- \[ ] Pin message → moves to top

\- \[ ] Unpin message → returns to chronological order

\- \[ ] Multiple pinned messages sort by pinned\_at

\- \[ ] Delete message → removes from list

\- \[ ] Delete message → removes all read records

\- \[ ] Regular users cannot see admin actions

\- \[ ] Admin actions work correctly



\### \*\*Post Message Form\*\*

\- \[ ] Category dropdown works

\- \[ ] Character counter updates live

\- \[ ] Blocks messages over 500 chars

\- \[ ] Blocks empty messages

\- \[ ] Blocks whitespace-only messages

\- \[ ] Pin checkbox works

\- \[ ] Cancel closes modal

\- \[ ] Success message displays

\- \[ ] Form clears after post



\### \*\*Message Display\*\*

\- \[ ] Messages sort correctly (pinned first, then newest)

\- \[ ] Category colors display correctly

\- \[ ] NEW badge appears for unread

\- \[ ] NEW badge disappears when read

\- \[ ] Pin icon shows for pinned messages

\- \[ ] Timestamps format correctly

\- \[ ] Author name displays

\- \[ ] Long messages wrap correctly

\- \[ ] Multiline messages preserve formatting



\### \*\*Empty State\*\*

\- \[ ] Shows when no messages

\- \[ ] Admin sees "Post first message"

\- \[ ] Users see "No messages yet"

\- \[ ] Post button appears for admin only



\### \*\*Offline Support\*\*

\- \[ ] Messages load offline (from Firestore cache)

\- \[ ] Can read messages offline

\- \[ ] Cannot post offline (show error)

\- \[ ] Syncs when connection returns



\### \*\*Permissions\*\*

\- \[ ] Admin can post messages

\- \[ ] Owner can post messages

\- \[ ] User cannot post messages

\- \[ ] User cannot see admin actions

\- \[ ] All users can read messages



\### \*\*Edge Cases\*\*

\- \[ ] Very long author names

\- \[ ] Messages with special characters

\- \[ ] Messages with line breaks

\- \[ ] 50+ messages (scrolling)

\- \[ ] Multiple users posting simultaneously

\- \[ ] Deleting while someone viewing

\- \[ ] Network errors during post



\### \*\*Mobile\*\*

\- \[ ] Badge visible on small screens

\- \[ ] Messages page scrolls smoothly

\- \[ ] Post modal fits on screen

\- \[ ] Textarea responsive

\- \[ ] Buttons tap-friendly (48px min)



---



\## \*\*📝 IMPLEMENTATION SUMMARY\*\*



\### \*\*Files to Create/Modify:\*\*



\*\*1. Create: `/src/components/Messages.jsx`\*\*

\- Main messages page component

\- Message list display

\- Post message modal

\- Pin/unpin/delete actions



\*\*2. Update: `/src/App.jsx`\*\*

\- Add Messages button to home

\- Add notification badge

\- Add unreadMessagesCount state

\- Add loadUnreadCount function

\- Add Messages route



\*\*3. Update: `/src/firestoreDb.js`\*\*

\- Add messages collection methods

\- Add message\_reads collection methods



\*\*Database methods needed:\*\*

```javascript

messages: {

&nbsp; async add(data) { /\* ... \*/ },

&nbsp; async toArray() { /\* ... \*/ },

&nbsp; async update(id, data) { /\* ... \*/ },

&nbsp; async delete(id) { /\* ... \*/ }

},



message\_reads: {

&nbsp; async add(data) { /\* ... \*/ },

&nbsp; where(field, operator, value) {

&nbsp;   return {

&nbsp;     async toArray() { /\* ... \*/ }

&nbsp;   };

&nbsp; },

&nbsp; async delete(id) { /\* ... \*/ }

}

```



---



\## \*\*🎯 SUMMARY FOR CLAUDE CODE\*\*



\*\*What to implement:\*\*



1\. \*\*Database Collections:\*\*

&nbsp;  - `festivals/{id}/messages` - Store messages

&nbsp;  - `festivals/{id}/message\_reads` - Track read status per user



2\. \*\*Messages.jsx Component:\*\*

&nbsp;  - Display messages (pinned first, then newest)

&nbsp;  - Post message modal (admin only)

&nbsp;  - Pin/unpin messages (admin only)

&nbsp;  - Delete messages (admin only)

&nbsp;  - Mark all as read when page opens

&nbsp;  - Show NEW badge for unread messages

&nbsp;  - Empty state when no messages



3\. \*\*App.jsx Updates:\*\*

&nbsp;  - Add Messages button to home (6th button)

&nbsp;  - Add notification badge with count

&nbsp;  - Load unread count on mount

&nbsp;  - Update count when returning from Messages

&nbsp;  - Add Messages page route



4\. \*\*Key Features:\*\*

&nbsp;  - 4 categories with color coding

&nbsp;  - 500 character limit

&nbsp;  - Pinned messages stay at top

&nbsp;  - Per-user read tracking

&nbsp;  - Admin-only posting

&nbsp;  - Offline support (Firestore cache)



5\. \*\*No Automatic Banners:\*\*

&nbsp;  - Messages never appear automatically

&nbsp;  - No UI shifts or disruption

&nbsp;  - User controls when to check

&nbsp;  - Badge notification only



---



\*\*Ready to hand to Claude Code?\*\* 🚀



\## \*\*🚨 URGENT MESSAGE MODAL - FINAL SPECIFICATION\*\*



Perfect! Here's the complete spec based on my recommendations:



---



\## \*\*📋 BEHAVIOR SUMMARY\*\*



\### \*\*Message Categories:\*\*

\- 🚨 \*\*URGENT\*\* → Modal popup (cannot miss)

\- ⚠️ \*\*ALERT\*\* → Badge only

\- 📢 \*\*ANNOUNCEMENT\*\* → Badge only

\- ℹ️ \*\*INFO\*\* → Badge only



\### \*\*When Modal Shows:\*\*

\- ✅ On app load (if unread urgent exists)

\- ✅ Every 30 seconds check for new urgent messages

\- ✅ Shows one urgent message at a time

\- ✅ Dismiss = mark as read, show next if exists



\### \*\*Modal Behavior:\*\*

\- ✅ Fixed overlay (no content shift)

\- ✅ Must dismiss (can't ignore)

\- ✅ "View All Messages" button

\- ✅ "Dismiss" button

\- ✅ Only shows once per urgent message



---



\## \*\*🎨 URGENT MODAL UI\*\*



```

┌─────────────────────────────────────────┐

│ DARK OVERLAY (rgba(0,0,0,0.85))        │

│                                         │

│   ┌─────────────────────────────────┐  │

│   │ 🚨 URGENT MESSAGE               │  │

│   ├─────────────────────────────────┤  │

│   │                                 │  │

│   │ Stage 2 running 30 minutes      │  │

│   │ behind schedule. All            │  │

│   │ performances shifted            │  │

│   │ accordingly.                    │  │

│   │                                 │  │

│   │ Sarah Connor • 12:45 PM         │  │

│   │                                 │  │

│   │ \[View All Messages]             │  │

│   │ \[Dismiss]                       │  │

│   └─────────────────────────────────┘  │

│                                         │

│ Home buttons underneath remain visible │

│ but dimmed - no shifting                │

└─────────────────────────────────────────┘

```



---



\## \*\*🔧 IMPLEMENTATION\*\*



\### \*\*Add to App.jsx:\*\*



\*\*State:\*\*

```javascript

const \[urgentMessage, setUrgentMessage] = useState(null);

const \[showUrgentModal, setShowUrgentModal] = useState(false);

```



\*\*Check Function:\*\*

```javascript

const checkForUrgentMessages = useCallback(async () => {

&nbsp; if (!db || !currentUser) return;

&nbsp; 

&nbsp; try {

&nbsp;   // Get all messages

&nbsp;   const messages = await db.messages.toArray();

&nbsp;   

&nbsp;   // Get read messages for current user

&nbsp;   const readMessages = await db.message\_reads

&nbsp;     .where('user\_id', '==', currentUser.uid)

&nbsp;     .toArray();

&nbsp;   

&nbsp;   const readIds = new Set(readMessages.map(r => r.message\_id));

&nbsp;   

&nbsp;   // Find unread urgent messages

&nbsp;   const unreadUrgent = messages.filter(

&nbsp;     msg => msg.category === 'urgent' \&\& !readIds.has(msg.id)

&nbsp;   );

&nbsp;   

&nbsp;   // Sort by newest first

&nbsp;   unreadUrgent.sort((a, b) => 

&nbsp;     b.created\_at.toMillis() - a.created\_at.toMillis()

&nbsp;   );

&nbsp;   

&nbsp;   // Show first unread urgent if exists

&nbsp;   if (unreadUrgent.length > 0 \&\& !showUrgentModal) {

&nbsp;     setUrgentMessage(unreadUrgent\[0]);

&nbsp;     setShowUrgentModal(true);

&nbsp;   }

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error checking urgent messages:', error);

&nbsp; }

}, \[db, currentUser, showUrgentModal]);

```



\*\*Check on Load \& Interval:\*\*

```javascript

useEffect(() => {

&nbsp; // Check on load

&nbsp; checkForUrgentMessages();

&nbsp; 

&nbsp; // Check every 30 seconds

&nbsp; const interval = setInterval(checkForUrgentMessages, 30000);

&nbsp; 

&nbsp; return () => clearInterval(interval);

}, \[checkForUrgentMessages]);

```



\*\*Dismiss Handler:\*\*

```javascript

const handleDismissUrgent = async () => {

&nbsp; if (!urgentMessage || !currentUser) return;

&nbsp; 

&nbsp; try {

&nbsp;   // Mark as read

&nbsp;   await db.message\_reads.add({

&nbsp;     user\_id: currentUser.uid,

&nbsp;     message\_id: urgentMessage.id,

&nbsp;     read\_at: new Date()

&nbsp;   });

&nbsp;   

&nbsp;   // Close modal

&nbsp;   setShowUrgentModal(false);

&nbsp;   setUrgentMessage(null);

&nbsp;   

&nbsp;   // Update unread count

&nbsp;   loadUnreadCount();

&nbsp;   

&nbsp;   // Check for next urgent message after short delay

&nbsp;   setTimeout(() => {

&nbsp;     checkForUrgentMessages();

&nbsp;   }, 500);

&nbsp;   

&nbsp; } catch (error) {

&nbsp;   console.error('Error dismissing urgent message:', error);

&nbsp; }

};

```



\*\*View All Handler:\*\*

```javascript

const handleViewAllMessages = async () => {

&nbsp; // Mark current urgent as read

&nbsp; if (urgentMessage \&\& currentUser) {

&nbsp;   await db.message\_reads.add({

&nbsp;     user\_id: currentUser.uid,

&nbsp;     message\_id: urgentMessage.id,

&nbsp;     read\_at: new Date()

&nbsp;   });

&nbsp; }

&nbsp; 

&nbsp; // Close modal and go to messages page

&nbsp; setShowUrgentModal(false);

&nbsp; setUrgentMessage(null);

&nbsp; setActiveTab('messages');

&nbsp; loadUnreadCount();

};

```



---



\### \*\*Modal JSX:\*\*



```javascript

{/\* Urgent Message Modal \*/}

{showUrgentModal \&\& urgentMessage \&\& (

&nbsp; <div style={styles.urgentModalOverlay}>

&nbsp;   <div style={styles.urgentModalCard}>

&nbsp;     <div style={styles.urgentModalHeader}>

&nbsp;       <span style={styles.urgentIcon}>🚨</span>

&nbsp;       <span style={styles.urgentTitle}>URGENT MESSAGE</span>

&nbsp;     </div>

&nbsp;     

&nbsp;     <div style={styles.urgentModalContent}>

&nbsp;       {urgentMessage.content}

&nbsp;     </div>

&nbsp;     

&nbsp;     <div style={styles.urgentModalFooter}>

&nbsp;       <div style={styles.urgentModalMeta}>

&nbsp;         {urgentMessage.author\_name} • {formatTime(urgentMessage.created\_at)}

&nbsp;       </div>

&nbsp;     </div>

&nbsp;     

&nbsp;     <div style={styles.urgentModalButtons}>

&nbsp;       <button 

&nbsp;         onClick={handleViewAllMessages}

&nbsp;         style={styles.urgentViewAllBtn}

&nbsp;       >

&nbsp;         View All Messages

&nbsp;       </button>

&nbsp;       <button 

&nbsp;         onClick={handleDismissUrgent}

&nbsp;         style={styles.urgentDismissBtn}

&nbsp;       >

&nbsp;         Dismiss

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; </div>

)}

```



---



\### \*\*Modal Styles:\*\*



```javascript

const styles = {

&nbsp; // ... existing styles ...

&nbsp; 

&nbsp; urgentModalOverlay: {

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

&nbsp; urgentModalCard: {

&nbsp;   background: '#2d2d2d',

&nbsp;   borderRadius: '12px',

&nbsp;   padding: '24px',

&nbsp;   maxWidth: '400px',

&nbsp;   width: '100%',

&nbsp;   border: '3px solid #f44336',

&nbsp;   boxShadow: '0 10px 40px rgba(244, 67, 54, 0.5)',

&nbsp;   animation: 'urgentPulse 2s ease-in-out infinite'

&nbsp; },

&nbsp; 

&nbsp; urgentModalHeader: {

&nbsp;   display: 'flex',

&nbsp;   alignItems: 'center',

&nbsp;   gap: '12px',

&nbsp;   marginBottom: '20px',

&nbsp;   paddingBottom: '16px',

&nbsp;   borderBottom: '2px solid #f44336'

&nbsp; },

&nbsp; 

&nbsp; urgentIcon: {

&nbsp;   fontSize: '32px'

&nbsp; },

&nbsp; 

&nbsp; urgentTitle: {

&nbsp;   fontSize: '18px',

&nbsp;   fontWeight: '700',

&nbsp;   color: '#ff6b6b',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1.5px'

&nbsp; },

&nbsp; 

&nbsp; urgentModalContent: {

&nbsp;   fontSize: '15px',

&nbsp;   color: '#e0e0e0',

&nbsp;   lineHeight: '1.6',

&nbsp;   marginBottom: '20px',

&nbsp;   whiteSpace: 'pre-wrap'

&nbsp; },

&nbsp; 

&nbsp; urgentModalFooter: {

&nbsp;   marginBottom: '20px'

&nbsp; },

&nbsp; 

&nbsp; urgentModalMeta: {

&nbsp;   fontSize: '12px',

&nbsp;   color: '#888',

&nbsp;   fontWeight: '600'

&nbsp; },

&nbsp; 

&nbsp; urgentModalButtons: {

&nbsp;   display: 'flex',

&nbsp;   flexDirection: 'column',

&nbsp;   gap: '10px'

&nbsp; },

&nbsp; 

&nbsp; urgentViewAllBtn: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#f44336',

&nbsp;   color: 'white',

&nbsp;   border: 'none',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   transition: 'background 0.2s'

&nbsp; },

&nbsp; 

&nbsp; urgentDismissBtn: {

&nbsp;   width: '100%',

&nbsp;   padding: '14px',

&nbsp;   background: '#2d2d2d',

&nbsp;   color: '#ccc',

&nbsp;   border: '2px solid #444',

&nbsp;   borderRadius: '6px',

&nbsp;   fontSize: '14px',

&nbsp;   fontWeight: '700',

&nbsp;   cursor: 'pointer',

&nbsp;   textTransform: 'uppercase',

&nbsp;   letterSpacing: '1px',

&nbsp;   transition: 'all 0.2s'

&nbsp; }

};

```



\*\*Add animation:\*\*

```javascript

<style>{`

&nbsp; @keyframes urgentPulse {

&nbsp;   0%, 100% {

&nbsp;     box-shadow: 0 10px 40px rgba(244, 67, 54, 0.5);

&nbsp;   }

&nbsp;   50% {

&nbsp;     box-shadow: 0 10px 60px rgba(244, 67, 54, 0.8);

&nbsp;   }

&nbsp; }

`}</style>

```



---



\## \*\*📱 ADDITIONAL FEATURES\*\*



\### \*\*1. Priority Emoji Badge (from earlier)\*\*



Show priority emoji on Messages button:



```javascript

const getMessageBadgeEmoji = useCallback(async () => {

&nbsp; if (!db || !currentUser) return '🔴';

&nbsp; 

&nbsp; try {

&nbsp;   const messages = await db.messages.toArray();

&nbsp;   const readMessages = await db.message\_reads

&nbsp;     .where('user\_id', '==', currentUser.uid)

&nbsp;     .toArray();

&nbsp;   

&nbsp;   const readIds = new Set(readMessages.map(r => r.message\_id));

&nbsp;   const unread = messages.filter(m => !readIds.has(m.id));

&nbsp;   

&nbsp;   if (unread.some(m => m.category === 'urgent')) return '🚨';

&nbsp;   if (unread.some(m => m.category === 'alert')) return '⚠️';

&nbsp;   if (unread.some(m => m.category === 'announcement')) return '📢';

&nbsp;   return 'ℹ️';

&nbsp; } catch {

&nbsp;   return '🔴';

&nbsp; }

}, \[db, currentUser]);

```



\*\*Display on button:\*\*

```javascript

{unreadMessagesCount > 0 \&\& (

&nbsp; <div style={styles.notificationBadge}>

&nbsp;   {messageBadgeEmoji} {unreadMessagesCount}

&nbsp; </div>

)}

```



---



\## \*\*🧪 TESTING CHECKLIST\*\*



\### \*\*Urgent Modal\*\*

\- \[ ] Modal appears on app load if unread urgent exists

\- \[ ] Modal checks every 30 seconds for new urgent

\- \[ ] Modal shows newest unread urgent first

\- \[ ] Dismiss button marks as read and closes modal

\- \[ ] Dismiss shows next urgent if multiple exist

\- \[ ] View All navigates to Messages page

\- \[ ] View All marks current urgent as read

\- \[ ] Modal overlay prevents interaction with background

\- \[ ] Modal is centered and responsive on mobile

\- \[ ] Pulsing animation works smoothly



\### \*\*Multiple Urgent Messages\*\*

\- \[ ] Shows one at a time

\- \[ ] After dismiss, next urgent appears

\- \[ ] Order is newest first

\- \[ ] All eventually shown

\- \[ ] Doesn't loop back to already-read



\### \*\*Timing\*\*

\- \[ ] Check on app load works

\- \[ ] 30-second interval works

\- \[ ] Doesn't show if already dismissed

\- \[ ] Doesn't show duplicate modals

\- \[ ] Interval cleans up on unmount



\### \*\*Edge Cases\*\*

\- \[ ] Admin posts urgent while user has app open

\- \[ ] User dismisses right as new urgent arrives

\- \[ ] Multiple users seeing same urgent

\- \[ ] Urgent deleted while user viewing

\- \[ ] Network offline (doesn't error)

\- \[ ] Very long urgent message (scrolls in modal)



\### \*\*Badge with Emoji\*\*

\- \[ ] Shows 🚨 when urgent unread

\- \[ ] Shows ⚠️ when only alerts unread

\- \[ ] Shows 📢 when only announcements unread

\- \[ ] Shows ℹ️ when only info unread

\- \[ ] Updates after dismissing urgent modal

\- \[ ] Updates after viewing messages page



---



\## \*\*📝 IMPLEMENTATION SUMMARY\*\*



\*\*Add to Messages.jsx spec:\*\*



1\. \*\*App.jsx Changes:\*\*

&nbsp;  - Add `urgentMessage` and `showUrgentModal` state

&nbsp;  - Add `checkForUrgentMessages` function

&nbsp;  - Add interval to check every 30 seconds

&nbsp;  - Add `handleDismissUrgent` function

&nbsp;  - Add `handleViewAllMessages` function

&nbsp;  - Add urgent modal JSX

&nbsp;  - Add urgent modal styles

&nbsp;  - Add priority emoji badge function



2\. \*\*Behavior:\*\*

&nbsp;  - Only 🚨 URGENT triggers modal

&nbsp;  - Shows on load + every 30 seconds

&nbsp;  - One message at a time

&nbsp;  - Dismiss = mark as read + show next

&nbsp;  - View All = go to Messages page

&nbsp;  - Badge shows priority emoji



3\. \*\*Styling:\*\*

&nbsp;  - Red border with glow

&nbsp;  - Pulsing animation

&nbsp;  - Dark overlay

&nbsp;  - Mobile responsive

&nbsp;  - Clear, urgent design



---



\*\*This completes the messaging system with urgent alerts! Ready for Claude Code?\*\* 🚀

