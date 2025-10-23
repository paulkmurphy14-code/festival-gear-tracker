import { createContext, useContext } from 'react';
import { useFestival } from './FestivalContext';
import { getFirestoreDb } from '../firestoreDb';

const DatabaseContext = createContext();

export function useDatabase() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }) {
  const { currentFestival } = useFestival();
  const db = currentFestival ? getFirestoreDb(currentFestival.id) : null;

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}