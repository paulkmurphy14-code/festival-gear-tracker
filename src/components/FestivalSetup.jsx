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
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
        border: '1px solid #ddd',
        boxSizing: 'border-box'
      }}
    />
  </div>

  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
        border: '1px solid #ddd',
        boxSizing: 'border-box'
      }}
    />
  </div>

  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
        border: '1px solid #ddd',
        boxSizing: 'border-box'
      }}
    />
  </div>

  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
        border: '1px solid #ddd',
        boxSizing: 'border-box'
      }}
    />
  </div>

  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
        border: '1px solid #ddd',
        boxSizing: 'border-box'
      }}
    />
  </div>

  <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
          border: '1px solid #ddd',
          boxSizing: 'border-box'
        }}
      />
    </div>
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
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
          border: '1px solid #ddd',
          boxSizing: 'border-box'
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