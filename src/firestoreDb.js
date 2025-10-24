import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

export function getFirestoreDb(festivalId) {
  if (!festivalId) {
    throw new Error('Festival ID required for database operations');
  }

  return {
    gear: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/gear`), data);
        return docRef.id;
      },
      
      async get(id) {
        const docRef = doc(db, `festivals/${festivalId}/gear`, String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      },
      
      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/gear`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },
      
      async update(id, data) {
        const docRef = doc(db, `festivals/${festivalId}/gear`, String(id));
        await updateDoc(docRef, data);
      },
      
      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/gear`, String(id)));
      },
      
      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/gear`),
              where(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          },
          
          async count() {
            const items = await this.toArray();
            return items.length;
          },
          
          async modify(updates) {
            const items = await this.toArray();
            for (const item of items) {
              await updateDoc(doc(db, `festivals/${festivalId}/gear`, String(item.id)), updates);
            }
          }
        };
      }
    },
    
    locations: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/locations`), data);
        return docRef.id;
      },
      
      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/locations`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },
      
      async update(id, data) {
        await updateDoc(doc(db, `festivals/${festivalId}/locations`, String(id)), data);
      },
      
      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/locations`, String(id)));
      }
    },
    
    performances: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/performances`), data);
        return docRef.id;
      },
    
    async update(id, data) {
      await updateDoc(doc(db, `festivals/${festivalId}/performances`, String(id)), data);
    },
    
    async delete(id) {
      await deleteDoc(doc(db, `festivals/${festivalId}/performances`, String(id)));
    },
      
      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/performances`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },
      
      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/performances`),
              where(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          },
          
          async delete() {
            const items = await this.toArray();
            for (const item of items) {
              await deleteDoc(doc(db, `festivals/${festivalId}/performances`, String(item.id)));
            }
          },
          
          async modify(updates) {
            const items = await this.toArray();
            for (const item of items) {
              await updateDoc(doc(db, `festivals/${festivalId}/performances`, String(item.id)), updates);
            }
          }
        };
      }
    },
    
    scans: {
      async add(data) {
        await addDoc(collection(db, `festivals/${festivalId}/scans`), data);
      }
    }
  };
}