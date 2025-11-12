import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFestival } from '../contexts/FestivalContext';
import { useRole } from '../hooks/useRole';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

export default function UserManagement() {
  const { currentUser } = useAuth();
  const { currentFestival } = useFestival();
  const { canManageUsers } = useRole();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [message, setMessage] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedUsers, setParsedUsers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkFormUsers, setBulkFormUsers] = useState([{ name: '', email: '', role: 'user' }]);

  useEffect(() => {
    if (canManageUsers && currentFestival) {
      loadUsers();
    }
  }, [canManageUsers, currentFestival]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Get all users for this festival
      const q = query(collection(db, 'users'), where('festivalId', '==', currentFestival.id));
      const snapshot = await getDocs(q);

      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      setMessage('⚠️ Email is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      // Check if user already has an invitation for THIS festival
      const q = query(
        collection(db, 'invitations'),
        where('email', '==', inviteEmail.trim()),
        where('festivalId', '==', currentFestival.id),
        where('status', '==', 'pending')
      );
      const existingInvitations = await getDocs(q);

      if (!existingInvitations.empty) {
        setMessage('⚠️ This user already has a pending invitation for this festival');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      // Create invitation (allows users to join multiple festivals)
      const invitationRef = doc(collection(db, 'invitations'));

      await setDoc(invitationRef, {
        email: inviteEmail.trim(),
        role: inviteRole,
        festivalId: currentFestival.id,
        festivalName: currentFestival.name,
        invitedBy: currentUser.uid,
        invitedAt: new Date(),
        status: 'pending',
        invitationId: invitationRef.id
      });

      // Generate invitation link
      const inviteLink = `${window.location.origin}?invite=${invitationRef.id}`;

      // Copy to clipboard
      navigator.clipboard.writeText(inviteLink);

      setMessage(`✅ Invitation created! Link copied to clipboard. Share it with ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('user');
      setTimeout(() => setMessage(''), 5000);

      // Show the link in console for easy access
      console.log('Invitation link:', inviteLink);
    } catch (error) {
      console.error('Error inviting user:', error);
      setMessage('❌ Error creating invitation');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    // Prevent changing owner role
    if (currentFestival.ownerId === userId) {
      setMessage('⚠️ Cannot change Owner role');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const confirmed = window.confirm(`Change user role to ${newRole.toUpperCase()}?`);
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      setMessage('✅ Role updated successfully');
      setTimeout(() => setMessage(''), 3000);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('❌ Error updating role');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRemoveUser = async (userId) => {
    // Prevent removing owner
    if (currentFestival.ownerId === userId) {
      setMessage('⚠️ Cannot remove Festival Owner');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const confirmed = window.confirm('Remove this user from the festival? They will lose access immediately.');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'users', userId));

      setMessage('✅ User removed successfully');
      setTimeout(() => setMessage(''), 3000);
      loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      setMessage('❌ Error removing user');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setCsvFile(selectedFile);
      setUploadError('');
    } else {
      setUploadError('Please select a valid CSV file');
    }
  };

  const parseCSV = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        setUploadError('CSV file is empty');
        return;
      }

      // Check for header
      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes('name') || firstLine.includes('email');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const users = [];
      const errors = [];
      const seenEmails = new Set();

      dataLines.forEach((line, index) => {
        const rowNum = hasHeader ? index + 2 : index + 1;

        if (!line.trim()) return;

        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

        if (parts.length < 3) {
          errors.push(`Row ${rowNum}: Expected 3 columns (Name, Email, Role)`);
          return;
        }

        const [name, email, role] = parts;

        // Validate name
        if (!name || name.length === 0) {
          errors.push(`Row ${rowNum}: Name is required`);
          return;
        }

        if (name.length > 100) {
          errors.push(`Row ${rowNum}: Name too long (max 100 characters)`);
          return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${rowNum}: Invalid email "${email}"`);
          return;
        }

        // Check duplicate
        if (seenEmails.has(email.toLowerCase())) {
          errors.push(`Row ${rowNum}: Duplicate email "${email}"`);
          return;
        }
        seenEmails.add(email.toLowerCase());

        // Validate role
        const normalizedRole = role.toLowerCase();
        if (normalizedRole !== 'admin' && normalizedRole !== 'user') {
          errors.push(`Row ${rowNum}: Role must be "admin" or "user", got "${role}"`);
          return;
        }

        users.push({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role: normalizedRole
        });
      });

      if (errors.length > 0) {
        setUploadError(`Validation errors:\n${errors.join('\n')}`);
        return;
      }

      if (users.length === 0) {
        setUploadError('No valid users found in CSV');
        return;
      }

      setParsedUsers(users);
      setShowPreview(true);

    } catch (error) {
      console.error('CSV parse error:', error);
      setUploadError('Error parsing CSV: ' + error.message);
    }
  };

  const generateInvitationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 3;
    const segmentLength = 2;

    const code = Array.from({ length: segments }, () => {
      return Array.from({ length: segmentLength }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    }).join('-');

    return `FEST-${code}`;
  };

  const createInvitations = async () => {
    try {
      setUploading(true);
      const invitations = [];

      for (const user of parsedUsers) {
        const code = generateInvitationCode();

        const invitationRef = doc(collection(db, 'invitations'));

        await setDoc(invitationRef, {
          code: code,
          email: user.email,
          name: user.name,
          role: user.role,
          festivalId: currentFestival.id,
          festivalName: currentFestival.name,
          invitedBy: currentUser.uid,
          invitedAt: new Date(),
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitationId: invitationRef.id
        });

        invitations.push({
          ...user,
          code: code
        });
      }

      // Export CSV for download
      exportInvitationsCSV(invitations);

      setUploading(false);
      setMessage(`✅ ${invitations.length} invitation(s) created successfully!`);
      setTimeout(() => setMessage(''), 5000);
      setShowBulkUpload(false);
      setShowPreview(false);
      setCsvFile(null);
      setParsedUsers([]);

    } catch (error) {
      console.error('Error creating invitations:', error);
      setUploadError('Failed to create invitations: ' + error.message);
      setUploading(false);
    }
  };

  const exportInvitationsCSV = (invitations) => {
    const header = 'Name,Email,Role,Invitation Code\n';
    const rows = invitations.map(inv =>
      `${inv.name},${inv.email},${inv.role},${inv.code}`
    ).join('\n');

    const csv = header + rows;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddFormRow = () => {
    setBulkFormUsers([...bulkFormUsers, { name: '', email: '', role: 'user' }]);
  };

  const handleRemoveFormRow = (index) => {
    if (bulkFormUsers.length > 1) {
      setBulkFormUsers(bulkFormUsers.filter((_, i) => i !== index));
    }
  };

  const handleFormUserChange = (index, field, value) => {
    const updated = [...bulkFormUsers];
    updated[index][field] = value;
    setBulkFormUsers(updated);
  };

  const validateBulkForm = () => {
    const errors = [];
    const seenEmails = new Set();

    bulkFormUsers.forEach((user, index) => {
      const rowNum = index + 1;

      // Validate name
      if (!user.name || !user.name.trim()) {
        errors.push(`Row ${rowNum}: Name is required`);
      } else if (user.name.length > 100) {
        errors.push(`Row ${rowNum}: Name too long (max 100 characters)`);
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!user.email || !user.email.trim()) {
        errors.push(`Row ${rowNum}: Email is required`);
      } else if (!emailRegex.test(user.email)) {
        errors.push(`Row ${rowNum}: Invalid email "${user.email}"`);
      } else if (seenEmails.has(user.email.toLowerCase())) {
        errors.push(`Row ${rowNum}: Duplicate email "${user.email}"`);
      } else {
        seenEmails.add(user.email.toLowerCase());
      }
    });

    return errors;
  };

  const handleBulkFormSubmit = async () => {
    const errors = validateBulkForm();

    if (errors.length > 0) {
      setUploadError(`Validation errors:\n${errors.join('\n')}`);
      return;
    }

    try {
      setUploading(true);
      const invitations = [];

      for (const user of bulkFormUsers) {
        const code = generateInvitationCode();
        const invitationRef = doc(collection(db, 'invitations'));

        await setDoc(invitationRef, {
          code: code,
          email: user.email.trim(),
          name: user.name.trim(),
          role: user.role,
          festivalId: currentFestival.id,
          festivalName: currentFestival.name,
          invitedBy: currentUser.uid,
          invitedAt: new Date(),
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitationId: invitationRef.id
        });

        invitations.push({
          name: user.name.trim(),
          email: user.email.trim(),
          role: user.role,
          code: code
        });
      }

      // Export CSV
      exportInvitationsCSV(invitations);

      setUploading(false);
      setMessage(`✅ ${invitations.length} invitation(s) created successfully!`);
      setTimeout(() => setMessage(''), 5000);
      setShowBulkForm(false);
      setBulkFormUsers([{ name: '', email: '', role: 'user' }]);
      setUploadError('');

    } catch (error) {
      console.error('Error creating invitations:', error);
      setUploadError('Failed to create invitations: ' + error.message);
      setUploading(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      owner: { bg: 'rgba(255, 165, 0, 0.2)', color: '#ffa500', border: '#ffa500' },
      admin: { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', border: '#4caf50' },
      user: { bg: 'rgba(96, 125, 139, 0.2)', color: '#78909c', border: '#78909c' }
    };

    const style = styles[role] || styles.user;

    return {
      padding: '4px 12px',
      background: style.bg,
      color: style.color,
      border: `2px solid ${style.border}`,
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };
  };

  if (!canManageUsers) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#888'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffa500' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Only the Festival Owner can manage users.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        color: '#888'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffa500' }}>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <h2 style={{
        marginTop: 0,
        marginBottom: '24px',
        fontSize: '16px',
        color: '#ffa500',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textAlign: 'center'
      }}>
        User Management
      </h2>

      {message && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          background: message.includes('⚠️') || message.includes('❌')
            ? 'rgba(244, 67, 54, 0.2)'
            : 'rgba(76, 175, 80, 0.2)',
          color: message.includes('⚠️') || message.includes('❌') ? '#ff6b6b' : '#4caf50',
          border: `2px solid ${message.includes('⚠️') || message.includes('❌') ? '#ff6b6b' : '#4caf50'}`,
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowBulkForm(true)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: '#ffa500',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          ✏️ Bulk Add (Form)
        </button>
        <button
          onClick={() => setShowBulkUpload(true)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: '#2d2d2d',
            color: '#ffa500',
            border: '2px solid #ffa500',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          📤 Bulk Upload (CSV)
        </button>
      </div>

      {/* Invite User Form */}
      <div style={{
        background: '#2d2d2d',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        border: '2px solid #664400'
      }}>
        <h3 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '18px',
          color: '#ffa500',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Invite Single User
        </h3>

        <form onSubmit={handleInviteUser}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffa500'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #664400',
                backgroundColor: '#1a1a1a',
                color: '#e0e0e0',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffa500'
            }}>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #664400',
                backgroundColor: '#1a1a1a',
                color: '#e0e0e0',
                boxSizing: 'border-box'
              }}
            >
              <option value="user">User - Day-to-day operations</option>
              <option value="admin">Admin - All operations (no user management)</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: '#ffa500',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 3px 0 #664400'
            }}
          >
            Send Invitation
          </button>
        </form>
      </div>

      {/* User List */}
      <div style={{
        background: '#2d2d2d',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #664400'
      }}>
        <h3 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '18px',
          color: '#ffa500',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Festival Team ({users.length})
        </h3>

        {users.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#888',
            fontSize: '14px'
          }}>
            No users found. Invite team members to get started.
          </div>
        ) : (
          <div>
            {users.map(user => (
              <div
                key={user.id}
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  background: '#1a1a1a',
                  borderRadius: '12px',
                  border: '1px solid #3a3a3a'
                }}
              >
                {/* Top row: Email and Role Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: user.id === currentFestival.ownerId ? '0' : '12px',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#e0e0e0',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.email}
                    </div>
                    {user.id === currentFestival.ownerId && (
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Festival Owner
                      </div>
                    )}
                  </div>
                  <div style={getRoleBadge(user.id === currentFestival.ownerId ? 'owner' : user.role)}>
                    {user.id === currentFestival.ownerId ? 'OWNER' : (user.role || 'user').toUpperCase()}
                  </div>
                </div>

                {/* Bottom row: Actions (only for non-owners) */}
                {user.id !== currentFestival.ownerId && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '2px solid #664400',
                        backgroundColor: '#2d2d2d',
                        color: '#e0e0e0',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(244, 67, 54, 0.2)',
                        color: '#ff6b6b',
                        border: '2px solid #ff6b6b',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => {
          setShowBulkUpload(false);
          setShowPreview(false);
          setCsvFile(null);
          setParsedUsers([]);
          setUploadError('');
        }}>
          <div style={{
            background: '#2d2d2d',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #ffa500'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #3a3a3a'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffa500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {showPreview ? 'Preview Users' : 'Bulk Upload Users'}
              </h3>
            </div>

            {uploadError && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                background: 'rgba(244, 67, 54, 0.2)',
                color: '#ff6b6b',
                borderRadius: '6px',
                border: '2px solid #f44336',
                fontSize: '13px',
                whiteSpace: 'pre-wrap'
              }}>
                {uploadError}
              </div>
            )}

            {!showPreview ? (
              <div>
                <div style={{
                  padding: '16px',
                  background: '#1a1a1a',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  border: '1px solid #3a3a3a'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#ffa500',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    CSV Format:
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#ccc',
                    fontFamily: 'monospace',
                    lineHeight: '1.6',
                    marginBottom: '8px'
                  }}>
                    Name, Email, Role<br/>
                    John Smith, john@crew.com, admin<br/>
                    Sarah Connor, sarah@crew.com, user
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#888'
                  }}>
                    Roles: <strong>admin</strong> or <strong>user</strong>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '2px dashed #ffa500',
                      backgroundColor: '#1a1a1a',
                      color: '#e0e0e0',
                      cursor: 'pointer'
                    }}
                  />
                  {csvFile && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      background: 'rgba(76, 175, 80, 0.2)',
                      color: '#4caf50',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      ✓ {csvFile.name}
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <button
                    onClick={parseCSV}
                    disabled={!csvFile}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: csvFile ? '#ffa500' : '#555',
                      color: csvFile ? '#1a1a1a' : '#888',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: csvFile ? 'pointer' : 'not-allowed',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Preview & Upload
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkUpload(false);
                      setCsvFile(null);
                      setUploadError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#2d2d2d',
                      color: '#ffa500',
                      border: '2px solid #ffa500',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '15px',
                  color: '#e0e0e0',
                  marginBottom: '20px',
                  fontWeight: '600'
                }}>
                  {parsedUsers.length} users ready to invite:
                </div>

                <div style={{ marginBottom: '20px' }}>
                  {parsedUsers.filter(u => u.role === 'admin').length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#ffa500',
                        fontWeight: '700',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Admins ({parsedUsers.filter(u => u.role === 'admin').length}):
                      </div>
                      {parsedUsers.filter(u => u.role === 'admin').map((user, idx) => (
                        <div key={idx} style={{
                          fontSize: '13px',
                          color: '#ccc',
                          marginBottom: '4px',
                          paddingLeft: '8px'
                        }}>
                          • {user.name} ({user.email})
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedUsers.filter(u => u.role === 'user').length > 0 && (
                    <div>
                      <div style={{
                        fontSize: '13px',
                        color: '#ffa500',
                        fontWeight: '700',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Users ({parsedUsers.filter(u => u.role === 'user').length}):
                      </div>
                      {parsedUsers.filter(u => u.role === 'user').map((user, idx) => (
                        <div key={idx} style={{
                          fontSize: '13px',
                          color: '#ccc',
                          marginBottom: '4px',
                          paddingLeft: '8px'
                        }}>
                          • {user.name} ({user.email})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.15)',
                  border: '1px solid #ffa500',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#ffa500',
                  marginBottom: '20px'
                }}>
                  ⚠️ Invitation codes will be generated and downloaded as CSV
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <button
                    onClick={createInvitations}
                    disabled={uploading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: uploading ? '#555' : '#ffa500',
                      color: uploading ? '#888' : '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    {uploading ? 'Creating...' : 'Confirm & Create Invitations'}
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    disabled={uploading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#2d2d2d',
                      color: uploading ? '#555' : '#ffa500',
                      border: `2px solid ${uploading ? '#555' : '#ffa500'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Form Modal */}
      {showBulkForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => {
          setShowBulkForm(false);
          setBulkFormUsers([{ name: '', email: '', role: 'user' }]);
          setUploadError('');
        }}>
          <div style={{
            background: '#2d2d2d',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #ffa500'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #3a3a3a'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffa500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Bulk Add Users (Form)
              </h3>
              <div style={{
                fontSize: '13px',
                color: '#888',
                marginTop: '8px'
              }}>
                Add multiple users at once. Invitation codes will be generated automatically.
              </div>
            </div>

            {uploadError && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                background: 'rgba(244, 67, 54, 0.2)',
                color: '#ff6b6b',
                borderRadius: '6px',
                border: '2px solid #f44336',
                fontSize: '13px',
                whiteSpace: 'pre-wrap'
              }}>
                {uploadError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              {bulkFormUsers.map((user, index) => (
                <div key={index} style={{
                  padding: '16px',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid #3a3a3a'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffa500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      User {index + 1}
                    </div>
                    {bulkFormUsers.length > 1 && (
                      <button
                        onClick={() => handleRemoveFormRow(index)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(244, 67, 54, 0.2)',
                          color: '#ff6b6b',
                          border: '2px solid #ff6b6b',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffa500'
                    }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => handleFormUserChange(index, 'name', e.target.value)}
                      placeholder="John Smith"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        border: '2px solid #664400',
                        backgroundColor: '#2d2d2d',
                        color: '#e0e0e0',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffa500'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => handleFormUserChange(index, 'email', e.target.value)}
                      placeholder="john@crew.com"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        border: '2px solid #664400',
                        backgroundColor: '#2d2d2d',
                        color: '#e0e0e0',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffa500'
                    }}>
                      Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => handleFormUserChange(index, 'role', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        border: '2px solid #664400',
                        backgroundColor: '#2d2d2d',
                        color: '#e0e0e0',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddFormRow}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2d2d2d',
                  color: '#ffa500',
                  border: '2px dashed #ffa500',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                + Add Another User
              </button>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(255, 165, 0, 0.15)',
              border: '1px solid #ffa500',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#ffa500',
              marginBottom: '20px'
            }}>
              ⚠️ Invitation codes will be generated and downloaded as CSV
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                onClick={handleBulkFormSubmit}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: uploading ? '#555' : '#ffa500',
                  color: uploading ? '#888' : '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {uploading ? 'Creating...' : `Create ${bulkFormUsers.length} Invitation(s)`}
              </button>
              <button
                onClick={() => {
                  setShowBulkForm(false);
                  setBulkFormUsers([{ name: '', email: '', role: 'user' }]);
                  setUploadError('');
                }}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#2d2d2d',
                  color: uploading ? '#555' : '#ffa500',
                  border: `2px solid ${uploading ? '#555' : '#ffa500'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
