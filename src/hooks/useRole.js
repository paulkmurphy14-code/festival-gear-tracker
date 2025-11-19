import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFestival } from '../contexts/FestivalContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to manage user roles and permissions
 *
 * Roles:
 * - owner: Full access, can manage users/roles
 * - admin: All operations except user management
 * - user: Day-to-day operations only
 */
export function useRole() {
  const { currentUser } = useAuth();
  const { currentFestival } = useFestival();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!currentUser || !currentFestival) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // First check if user is the festival owner
        if (currentFestival.ownerId === currentUser.uid) {
          setRole('owner');
          setLoading(false);
          return;
        }

        // Check user document for role
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Verify user belongs to this festival
          if (userData.festivalId === currentFestival.id) {
            setRole(userData.role || 'user');
          } else {
            setRole(null);
          }
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      }

      setLoading(false);
    }

    fetchRole();
  }, [currentUser, currentFestival]);

  // Permission checks based on provided matrix
  const permissions = {
    // All Users (Owner, Admin, User)
    canScanQR: role !== null,
    canViewGearList: role !== null,
    canRegisterSingleItem: role !== null,
    canEditGear: role !== null,
    canManualLocationChange: role !== null,
    canBulkLocationChange: role !== null,
    canBulkCheckout: role !== null,
    canViewSchedule: role !== null,

    // Owner + Admin Only
    canDeleteGear: role === 'owner' || role === 'admin',
    canBulkUploadCSV: role === 'owner' || role === 'admin',
    canUploadScheduleCSV: role === 'owner' || role === 'admin',
    canManageLocations: role === 'owner' || role === 'admin',
    canEditStowage: role === 'owner' || role === 'admin',

    // Owner Only
    canManageUsers: role === 'owner',
    canManageRoles: role === 'owner',
  };

  return {
    role,
    loading,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isUser: role === 'user',
    hasRole: role !== null,
    ...permissions
  };
}
