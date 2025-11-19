import { createContext, useContext, useMemo } from 'react';
import { useFestival } from './FestivalContext';
import { getFirestoreDb } from '../firestoreDb';

const DatabaseContext = createContext();

export function useDatabase() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }) {
  const { currentFestival } = useFestival();

  // Memoize db object to prevent unnecessary re-creation on every render
  // Only recreate when the festival ID actually changes
  const db = useMemo(
    () => currentFestival ? getFirestoreDb(currentFestival.id) : null,
    [currentFestival?.id]
  );

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}