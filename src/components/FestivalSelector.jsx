import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function FestivalSelector({ user, onSelectFestival }) {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserFestivals();
  }, [user]);

  const loadUserFestivals = async () => {
    if (!user) return;

    try {
      // Get user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      // Support both old (single festival) and new (multiple festivals) schema
      let userFestivals = [];

      if (userData.festivals && Array.isArray(userData.festivals)) {
        // New schema: array of {festivalId, role}
        userFestivals = userData.festivals;
      } else if (userData.festivalId) {
        // Old schema: single festivalId
        userFestivals = [{
          festivalId: userData.festivalId,
          role: userData.role || 'user'
        }];
      }

      // Load festival details for each
      const festivalDetails = await Promise.all(
        userFestivals.map(async (uf) => {
          const festivalDoc = await getDoc(doc(db, 'festivals', uf.festivalId));
          if (festivalDoc.exists()) {
            return {
              id: festivalDoc.id,
              ...festivalDoc.data(),
              userRole: uf.role
            };
          }
          return null;
        })
      );

      setFestivals(festivalDetails.filter(f => f !== null));
      setLoading(false);

    } catch (error) {
      console.error('Error loading festivals:', error);
      setLoading(false);
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
        <div style={{ color: '#ffa500', fontSize: '18px' }}>Loading festivals...</div>
      </div>
    );
  }

  if (festivals.length === 0) {
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
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          border: '2px solid #664400'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎪</div>
          <h2 style={{ color: '#ffa500', marginBottom: '16px' }}>No Festivals Found</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>
            You haven't been added to any festivals yet. Ask a festival admin to invite you!
          </p>
        </div>
      </div>
    );
  }

  if (festivals.length === 1) {
    // Auto-select if only one festival
    onSelectFestival(festivals[0].id);
    return null;
  }

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
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        border: '2px solid #664400'
      }}>
        <h2 style={{
          color: '#ffa500',
          marginTop: 0,
          marginBottom: '24px',
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Select Festival
        </h2>

        <p style={{ color: '#888', marginBottom: '32px', textAlign: 'center' }}>
          You're part of multiple festivals. Which one would you like to access?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {festivals.map((festival) => (
            <button
              key={festival.id}
              onClick={() => onSelectFestival(festival.id)}
              style={{
                background: '#1a1a1a',
                border: '2px solid #664400',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                ':hover': {
                  borderColor: '#ffa500',
                  background: '#2a2a2a'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ffa500';
                e.currentTarget.style.background = '#2a2a2a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#664400';
                e.currentTarget.style.background = '#1a1a1a';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#ffa500',
                    marginBottom: '8px'
                  }}>
                    {festival.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Your role: <span style={{ color: '#ccc', fontWeight: '600' }}>{festival.userRole}</span>
                  </div>
                </div>
                <div style={{ fontSize: '32px' }}>→</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
