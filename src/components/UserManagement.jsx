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
          Invite New User
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
                  border: '1px solid #3a3a3a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#e0e0e0',
                    marginBottom: '4px'
                  }}>
                    {user.email}
                  </div>
                  {user.id === currentFestival.ownerId && (
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      Festival Owner - Cannot be changed
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {user.id === currentFestival.ownerId ? (
                    <div style={getRoleBadge('owner')}>Owner</div>
                  ) : (
                    <>
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '14px',
                          borderRadius: '8px',
                          border: '2px solid #664400',
                          backgroundColor: '#1a1a1a',
                          color: '#e0e0e0',
                          fontWeight: '600'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(244, 67, 54, 0.2)',
                          color: '#ff6b6b',
                          border: '2px solid #ff6b6b',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
