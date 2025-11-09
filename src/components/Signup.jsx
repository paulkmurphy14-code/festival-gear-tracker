import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Signup({ onSwitchToLogin, invitation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
    } catch (err) {
      setError('Failed to create account: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Invitation Banner */}
      {invitation && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2d2d2d',
          border: '2px solid #ffa500',
          borderRadius: '8px',
          padding: '16px 24px',
          maxWidth: '500px',
          width: '90%',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3)'
        }}>
          <div style={{ fontSize: '14px', color: '#ffa500', fontWeight: '700', marginBottom: '8px' }}>
            📨 You've been invited!
          </div>
          <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '4px' }}>
            Join <strong>{invitation.festivalName}</strong> as a <strong>{invitation.role}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Create an account to accept this invitation
          </div>
        </div>
      )}

      <div style={{
        background: '#2d2d2d',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        border: '2px solid #664400'
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center', color: '#ffa500', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Festival Gear Tracker
        </h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>
          Create your account
        </p>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ffa500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ffa500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ffa500' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
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
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#3a3a3a' : '#ffa500',
              color: loading ? '#666' : '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 3px 0 #664400'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
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
        </p>
      </div>
    </div>
  );
}