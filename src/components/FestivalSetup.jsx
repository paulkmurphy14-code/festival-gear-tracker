import { useState } from 'react';
import { useFestival } from '../contexts/FestivalContext';

export default function FestivalSetup() {
  const [festivalName, setFestivalName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createFestival } = useFestival();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!festivalName.trim()) {
      return setError('Festival name is required');
    }

    try {
      setError('');
      setLoading(true);
      await createFestival(festivalName.trim());
      window.location.reload();
    } catch (err) {
      setError('Failed to create festival: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center', color: '#1a1a1a' }}>
          🎪 Welcome to Festival Gear Tracker
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Let's set up your festival
        </p>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              Festival Name
            </label>
            <input
              type="text"
              value={festivalName}
              onChange={(e) => setFestivalName(e.target.value)}
              placeholder="e.g., Summer Music Festival 2025"
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
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
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Festival...' : 'Create Festival'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1976d2'
        }}>
          <strong>📝 Note:</strong> You'll get a 30-day free trial to test all features.
        </div>
      </div>
    </div>
  );
}