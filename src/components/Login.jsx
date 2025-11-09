import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError('Failed to log in: ' + err.message);
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
          Log in to your account
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

          <div style={{ marginBottom: '24px' }}>
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffa500',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}