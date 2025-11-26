import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, arrayUnion } from 'firebase/firestore';
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
        console.log('DEBUG FestivalContext: Loading festival for user', currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

        console.log('DEBUG FestivalContext: userDoc.exists()?', userDoc.exists());
        if (!userDoc.exists()) {
          console.log('DEBUG FestivalContext: User document does not exist!');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        console.log('DEBUG FestivalContext: userData:', userData);

        // Check for selected festival in localStorage
        const storedFestivalId = localStorage.getItem(`selectedFestival_${currentUser.uid}`);

        let festivalIdToLoad = null;

        // Support both old (single festival) and new (multiple festivals) schema
        console.log('DEBUG FestivalContext: userData.festivals:', userData.festivals);
        console.log('DEBUG FestivalContext: Is array?', Array.isArray(userData.festivals));

        if (userData.festivals && Array.isArray(userData.festivals)) {
          // New schema: array of {festivalId, role}
          console.log('DEBUG FestivalContext: festivals.length:', userData.festivals.length);

          if (userData.festivals.length === 0) {
            console.log('DEBUG FestivalContext: No festivals in array!');
            setLoading(false);
            return;
          }

          if (userData.festivals.length === 1) {
            // Auto-select if only one
            festivalIdToLoad = userData.festivals[0].festivalId;
            console.log('DEBUG FestivalContext: Auto-selecting festival:', festivalIdToLoad);
          } else if (storedFestivalId && userData.festivals.some(f => f.festivalId === storedFestivalId)) {
            // Use stored selection if valid
            festivalIdToLoad = storedFestivalId;
            console.log('DEBUG FestivalContext: Using stored festival:', festivalIdToLoad);
          } else {
            // Need user to select
            console.log('DEBUG FestivalContext: Multiple festivals, needs selection');
            setNeedsSelection(true);
            setLoading(false);
            return;
          }
        } else if (userData.festivalId) {
          // Old schema: single festivalId
          festivalIdToLoad = userData.festivalId;
          console.log('DEBUG FestivalContext: Using old schema festivalId:', festivalIdToLoad);
        } else {
          console.log('DEBUG FestivalContext: No festival data found!');
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

  const acceptInvitation = async (invitation) => {
    if (!currentUser || !invitation) {
      throw new Error('Missing user or invitation data');
    }

    try {
      // Update user document to add festival
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing user
        const userData = userDoc.data();
        let festivals = [];

        // Get existing festivals or migrate from old schema
        if (userData.festivals && Array.isArray(userData.festivals)) {
          festivals = [...userData.festivals];
        } else if (userData.festivalId) {
          // Migrate old schema to new
          festivals = [{
            festivalId: userData.festivalId,
            role: userData.role || 'user'
          }];
        }

        // Check if user is already in this festival
        const existingIndex = festivals.findIndex(f => f.festivalId === invitation.festivalId);

        if (existingIndex >= 0) {
          // Update role if already in festival
          festivals[existingIndex].role = invitation.role;
        } else {
          // Add new festival
          festivals.push({
            festivalId: invitation.festivalId,
            role: invitation.role
          });
        }

        // Update with new schema and remove old fields
        // Also store simple festivalIds array for Firestore rules
        const festivalIds = festivals.map(f => f.festivalId);
        await updateDoc(userDocRef, {
          festivals: festivals,
          festivalIds: festivalIds,  // Simple array for rules checking
          festivalId: null,  // Remove old schema field
          role: null         // Remove old schema field
        });
      } else {
        // Create new user document with new schema
        await setDoc(userDocRef, {
          email: currentUser.email,
          festivals: [{
            festivalId: invitation.festivalId,
            role: invitation.role
          }],
          festivalIds: [invitation.festivalId],  // Simple array for rules checking
          createdAt: new Date()
        });
      }

      // Mark invitation as accepted
      const invitationRef = doc(db, 'invitations', invitation.id);
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: currentUser.uid
      });

      // Store festival selection in localStorage
      localStorage.setItem(`selectedFestival_${currentUser.uid}`, invitation.festivalId);

      // Directly load the festival (no reload needed!)
      await selectFestival(invitation.festivalId);

      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
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

    // Initialize default locations for the festival
    const defaultLocations = [
      { name: 'Band Registration Area', type: 'registration', color: '#9b59b6', emoji: '📝' },
      { name: 'Tags Not Collected', type: 'registration', color: '#e74c3c', emoji: '❌' }
    ];

    const locationsCollection = collection(db, `festivals/${festivalRef.id}/locations`);
    for (const location of defaultLocations) {
      await addDoc(locationsCollection, location);
    }

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

        // Create festivalIds array for Firestore rules
        const festivalIds = festivals.map(f => f.festivalId);

        await updateDoc(userDocRef, {
          festivals: festivals,
          festivalIds: festivalIds,  // Simple array for Firestore rules
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
          festivalIds: [festivalRef.id],  // Simple array for Firestore rules
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
    acceptInvitation,
    loading,
    needsSelection
  };

  return (
    <FestivalContext.Provider value={value}>
      {!loading && children}
    </FestivalContext.Provider>
  );
}