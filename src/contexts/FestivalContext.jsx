import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FestivalContext = createContext();

export function useFestival() {
  return useContext(FestivalContext);
}

export function FestivalProvider({ children }) {
  const { currentUser } = useAuth();
  const [currentFestival, setCurrentFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSelection, setNeedsSelection] = useState(false);

  useEffect(() => {
    async function loadUserFestival() {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Check for selected festival in localStorage
        const storedFestivalId = localStorage.getItem(`selectedFestival_${currentUser.uid}`);

        let festivalIdToLoad = null;

        // Support both old (single festival) and new (multiple festivals) schema
        if (userData.festivals && Array.isArray(userData.festivals)) {
          // New schema: array of {festivalId, role}
          if (userData.festivals.length === 0) {
            setLoading(false);
            return;
          }

          if (userData.festivals.length === 1) {
            // Auto-select if only one
            festivalIdToLoad = userData.festivals[0].festivalId;
          } else if (storedFestivalId && userData.festivals.some(f => f.festivalId === storedFestivalId)) {
            // Use stored selection if valid
            festivalIdToLoad = storedFestivalId;
          } else {
            // Need user to select
            setNeedsSelection(true);
            setLoading(false);
            return;
          }
        } else if (userData.festivalId) {
          // Old schema: single festivalId
          festivalIdToLoad = userData.festivalId;
        }

        if (festivalIdToLoad) {
          const festivalDoc = await getDoc(doc(db, 'festivals', festivalIdToLoad));
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

    if (!currentUser) {
      setCurrentFestival(null);
      setNeedsSelection(false);
      setLoading(false);
      return;
    }

    loadUserFestival();
  }, [currentUser]);

  const selectFestival = async (festivalId) => {
    try {
      const festivalDoc = await getDoc(doc(db, 'festivals', festivalId));
      if (festivalDoc.exists()) {
        setCurrentFestival({
          id: festivalDoc.id,
          ...festivalDoc.data()
        });
        // Store selection
        localStorage.setItem(`selectedFestival_${currentUser.uid}`, festivalId);
        setNeedsSelection(false);
      }
    } catch (error) {
      console.error('Error selecting festival:', error);
    }
  };

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

      // Add festival to user's festivals array
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists - add new festival to their array
        const userData = userDoc.data();
        let festivals = [];

        // Get existing festivals or migrate from old schema
        if (userData.festivals && Array.isArray(userData.festivals)) {
          festivals = [...userData.festivals];
        } else if (userData.festivalId) {
          // Migrate old schema
          festivals = [{
            festivalId: userData.festivalId,
            role: userData.role || 'user'
          }];
        }

        // Add new festival as owner
        festivals.push({
          festivalId: festivalRef.id,
          role: 'owner'
        });

        await updateDoc(userDocRef, {
          festivals: festivals,
          festivalId: null,  // Remove old schema
          role: null         // Remove old schema
        });
      } else {
        // New user - create with new schema
        await setDoc(userDocRef, {
          email: currentUser.email,
          festivals: [{
            festivalId: festivalRef.id,
            role: 'owner'
          }],
          createdAt: new Date()
        });
      }

      setCurrentFestival({
        id: festivalRef.id,
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

      localStorage.setItem(`selectedFestival_${currentUser.uid}`, festivalRef.id);

      return festivalRef.id;
    } catch (error) {
      console.error('Error creating festival:', error);
      throw error;
    }
  }

  const value = {
    currentFestival,
    createFestival,
    selectFestival,
    loading,
    needsSelection
  };

  return (
    <FestivalContext.Provider value={value}>
      {!loading && children}
    </FestivalContext.Provider>
  );
}