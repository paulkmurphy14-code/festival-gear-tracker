import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FestivalContext = createContext();

export function useFestival() {
  return useContext(FestivalContext);
}

export function FestivalProvider({ children }) {
  const { currentUser } = useAuth();
  const [currentFestival, setCurrentFestival] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setCurrentFestival(null);
      setLoading(false);
      return;
    }

    loadUserFestival();
  }, [currentUser]);

  async function loadUserFestival() {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists() && userDoc.data().festivalId) {
        const festivalDoc = await getDoc(doc(db, 'festivals', userDoc.data().festivalId));
        
        if (festivalDoc.exists()) {
          setCurrentFestival({
            id: festivalDoc.id,
            ...festivalDoc.data()
          });
        }
      }
    } catch (error) {
      console.error('Error loading festival:', error);
    }
    setLoading(false);
  }

 async function createFestival(formData) {
  try {
    const festivalRef = doc(collection(db, 'festivals'));
    
    await setDoc(festivalRef, {
      name: formData.festivalName,
      registrarName: formData.registrarName,
      location: formData.location,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || '',
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      ownerId: currentUser.uid,
      createdAt: new Date(),
      licenseStatus: 'trial',
      licenseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        festivalId: festivalRef.id,
        role: 'owner'
      });

      setCurrentFestival({
        id: festivalRef.id,
        name: formData.festivalName,
        ownerId: currentUser.uid
      });

      return festivalRef.id;
    } catch (error) {
      console.error('Error creating festival:', error);
      throw error;
    }
  }

  const value = {
    currentFestival,
    createFestival,
    loading
  };

  return (
    <FestivalContext.Provider value={value}>
      {!loading && children}
    </FestivalContext.Provider>
  );
}