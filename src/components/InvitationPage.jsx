import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useFestival } from '../contexts/FestivalContext';

export default function InvitationPage() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const { currentUser, signup, logout } = useAuth();
  const { acceptInvitation } = useFestival();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  // Auto-accept if user is already logged in (for existing users clicking invitation links)
  useEffect(() => {
    if (currentUser && invitation && invitation.status === 'pending' && !accepting) {
      handleAccept();
    }
  }, [currentUser, invitation]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const inviteDoc = await getDoc(doc(db, 'invitations', invitationId));

      if (!inviteDoc.exists()) {
        setError('Invitation not found or has expired');
        setLoading(false);
        return;
      }

      const data = inviteDoc.data();

      if (data.status !== 'pending') {
        setError('This invitation has already been used');
        setLoading(false);
        return;
      }

      // Check if expired
      if (data.expiresAt && data.expiresAt.toDate && new Date(data.expiresAt.toDate()) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      setInvitation({ id: invitationId, ...data });
      setLoading(false);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation');
      setLoading(false);
    }
  };

  const handleCreateAccountAndAccept = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setAccepting(true);

      // Create account with email from invitation
      await signup(invitation.email, password);

      // Accept invitation
      await acceptInvitation(invitation);

      // Log out so they have to log in fresh (this forces FestivalContext to reload)
      await logout();

      // Redirect to login page
      navigate('/', { replace: true });

    } catch (err) {
      console.error('Error creating account:', err);
      setError('Failed to create account: ' + err.message);
      setAccepting(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser || !invitation) return;

    try {
      setAccepting(true);
      await acceptInvitation(invitation);

      // Clear invitation from localStorage
      localStorage.removeItem('pendingInvitation');

      // Force full page reload to properly load festival context
      window.location.href = '/';

    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation: ' + err.message);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#ffa500', fontSize: '18px' }}>
          Loading invitation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#2d2d2d',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '2px solid #ff6b6b'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ff6b6b', marginBottom: '16px' }}>
            {error}
          </h2>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '14px 24px',
              background: '#ffa500',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // User is already logged in - show accept button or auto-accepting
  if (currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#2d2d2d',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          border: '2px solid #ffa500'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎪</div>
            <h2 style={{ color: '#ffa500', marginBottom: '16px', fontSize: '24px' }}>
              {accepting ? 'Joining Festival...' : "You've Been Invited!"}
            </h2>
          </div>

          {!accepting && (
            <>
              <div style={{
                padding: '20px',
                background: '#1a1a1a',
                borderRadius: '12px',
                marginBottom: '30px',
                border: '2px solid #664400'
              }}>
                <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '12px' }}>
                  <strong style={{ color: '#ffa500' }}>Festival:</strong>{' '}
                  {invitation.festivalName}
                </div>
                <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '12px' }}>
                  <strong style={{ color: '#ffa500' }}>Role:</strong>{' '}
                  <span style={{
                    textTransform: 'uppercase',
                    color: invitation.role === 'admin' ? '#4caf50' : '#888',
                    fontWeight: '700'
                  }}>
                    {invitation.role}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                  Invited by festival admin
                </div>
              </div>

              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: accepting ? '#3a3a3a' : '#ffa500',
                  color: accepting ? '#666' : '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: accepting ? 'not-allowed' : 'pointer',
                  boxShadow: accepting ? 'none' : '0 3px 0 #664400'
                }}
              >
                {accepting ? 'Accepting...' : 'Accept Invitation & Join'}
              </button>
            </>
          )}

          {accepting && (
            <div style={{ textAlign: 'center', color: '#888', fontSize: '14px' }}>
              Please wait...
            </div>
          )}
        </div>
      </div>
    );
  }

  // User NOT logged in - show password setup form
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#2d2d2d',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        border: '2px solid #ffa500'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎪</div>
          <h2 style={{ color: '#ffa500', marginBottom: '16px', fontSize: '24px' }}>
            You've Been Invited!
          </h2>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Create your account to join the team
          </p>
        </div>

        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #664400'
        }}>
          <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '12px' }}>
            <strong style={{ color: '#ffa500' }}>Festival:</strong>{' '}
            {invitation.festivalName}
          </div>
          <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '12px' }}>
            <strong style={{ color: '#ffa500' }}>Your Email:</strong>{' '}
            {invitation.email}
          </div>
          <div style={{ fontSize: '16px', color: '#e0e0e0', marginBottom: '12px' }}>
            <strong style={{ color: '#ffa500' }}>Role:</strong>{' '}
            <span style={{
              textTransform: 'uppercase',
              color: invitation.role === 'admin' ? '#4caf50' : '#888',
              fontWeight: '700'
            }}>
              {invitation.role}
            </span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            background: 'rgba(244, 67, 54, 0.2)',
            color: '#ff6b6b',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateAccountAndAccept}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#ffa500'
            }}>
              Create Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#ffa500'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter password"
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

          <button
            type="submit"
            disabled={accepting}
            style={{
              width: '100%',
              padding: '16px',
              background: accepting ? '#3a3a3a' : '#ffa500',
              color: accepting ? '#666' : '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: accepting ? 'not-allowed' : 'pointer',
              boxShadow: accepting ? 'none' : '0 3px 0 #664400'
            }}
          >
            {accepting ? 'Creating Account...' : 'Create Account & Join Festival'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#888'
        }}>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffa500',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
