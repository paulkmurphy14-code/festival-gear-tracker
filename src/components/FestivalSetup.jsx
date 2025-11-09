import { useState } from 'react';
import { useFestival } from '../contexts/FestivalContext';

export default function FestivalSetup() {
  const [formData, setFormData] = useState({
  festivalName: '',
  registrarName: '',
  location: '',
  contactEmail: '',
  contactPhone: '',
  startDate: '',
  endDate: ''
});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createFestival } = useFestival();

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.festivalName.trim() || !formData.registrarName.trim() || 
      !formData.location.trim() || !formData.contactEmail.trim()) {
    return setError('Please fill in all required fields');
  }

  try {
    setError('');
    setLoading(true);
    await createFestival(formData);
  } catch (err) {
    setError('Failed to create festival: ' + err.message);
    setLoading(false);
  }
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
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        border: '2px solid #664400'
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center', color: '#ffa500', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🎪 Welcome to Festival Gear Tracker
        </h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>
          Let's set up your festival
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
      Festival Name *
    </label>
    <input
      type="text"
      value={formData.festivalName}
      onChange={(e) => setFormData({...formData, festivalName: e.target.value})}
      placeholder="e.g., Summer Music Festival 2025"
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
      Your Name *
    </label>
    <input
      type="text"
      value={formData.registrarName}
      onChange={(e) => setFormData({...formData, registrarName: e.target.value})}
      placeholder="John Smith"
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
      Festival Location/Address *
    </label>
    <input
      type="text"
      value={formData.location}
      onChange={(e) => setFormData({...formData, location: e.target.value})}
      placeholder="City, Country"
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
      Contact Email *
    </label>
    <input
      type="email"
      value={formData.contactEmail}
      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
      placeholder="contact@festival.com"
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
      Contact Phone
    </label>
    <input
      type="tel"
      value={formData.contactPhone}
      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
      placeholder="+353 123 456 789"
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

  <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ffa500' }}>
        Start Date
      </label>
      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '2px solid #664400',
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          boxSizing: 'border-box',
          colorScheme: 'dark'
        }}
      />
    </div>
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ffa500' }}>
        End Date
      </label>
      <input
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '2px solid #664400',
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          boxSizing: 'border-box',
          colorScheme: 'dark'
        }}
      />
    </div>
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
    {loading ? 'Creating Festival...' : 'Create Festival'}
  </button>
</form>

        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: 'rgba(76, 175, 80, 0.2)',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#4caf50',
          border: '2px solid #4caf50'
        }}>
          <strong>📝 Note:</strong> You'll get a 30-day free trial to test all features.
        </div>
      </div>
    </div>
  );
}