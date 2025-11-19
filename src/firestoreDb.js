import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  getDocsFromServer,
  updateDoc,
  deleteDoc,
  query,
  where as fbWhere,
  increment,
  runTransaction
} from 'firebase/firestore';

export function getFirestoreDb(festivalId) {
  if (!festivalId) {
    throw new Error('Festival ID required for database operations');
  }

  return {
    gear: {
      async add(data) {
        // Get and increment counter atomically
        const festivalRef = doc(db, 'festivals', festivalId);
        await updateDoc(festivalRef, {
          gearCounter: increment(1)
        });
  
        // Get the new counter value
        const festivalDoc = await getDoc(festivalRef);
        const displayId = festivalDoc.data().gearCounter;
  
        // Add gear with display_id
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/gear`), {
          ...data,
          display_id: displayId
        });
  
        return docRef.id;
      },
      async get(id) {
        const docRef = doc(db, `festivals/${festivalId}/gear`, String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      },
      
      async toArray() {
        const snapshot = await getDocsFromServer(collection(db, `festivals/${festivalId}/gear`));
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
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
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
        const snapshot = await getDocsFromServer(collection(db, `festivals/${festivalId}/locations`));
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
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
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
       },

       where(field, operator, value) {
         return {
           async toArray() {
             const q = query(
               collection(db, `festivals/${festivalId}/scans`),
               fbWhere(field, operator === '==' ? '==' : operator, value)
             );
             const snapshot = await getDocs(q);
             return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           }
         };
       }
     },

    messages: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/messages`), data);
        return docRef.id;
      },

      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/messages`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },

      async update(id, data) {
        await updateDoc(doc(db, `festivals/${festivalId}/messages`, String(id)), data);
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/messages`, String(id)));
      }
    },

    message_reads: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/message_reads`), data);
        return docRef.id;
      },

      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/message_reads`),
              fbWhere(field, operator === '==' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        };
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/message_reads`, String(id)));
      }
    },

    bands: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/bands`), data);
        return docRef.id;
      },

      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/bands`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/bands`, String(id)));
      },

      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/bands`),
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        };
      }
    },

    invitations: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/invitations`), data);
        return docRef.id;
      },

      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/invitations`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },

      async update(id, data) {
        await updateDoc(doc(db, `festivals/${festivalId}/invitations`, String(id)), data);
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/invitations`, String(id)));
      },

      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/invitations`),
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        };
      }
    },

    reminders: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/reminders`), data);
        return docRef.id;
      },

      async toArray() {
        const snapshot = await getDocs(collection(db, `festivals/${festivalId}/reminders`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },

      async update(id, data) {
        await updateDoc(doc(db, `festivals/${festivalId}/reminders`, String(id)), data);
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/reminders`, String(id)));
      },

      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/reminders`),
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        };
      }
    },

    containers: {
      async add(data) {
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/containers`), data);
        return docRef.id;
      },

      async toArray() {
        const snapshot = await getDocsFromServer(collection(db, `festivals/${festivalId}/containers`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },

      async get(id) {
        const docRef = doc(db, `festivals/${festivalId}/containers`, String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      },

      async update(id, data) {
        await updateDoc(doc(db, `festivals/${festivalId}/containers`, String(id)), data);
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/containers`, String(id)));
      },

      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/containers`),
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        };
      }
    },

    stowage_items: {
      async add(data) {
        // Remove id field before saving (Firestore generates its own ID)
        const { id, ...dataWithoutId } = data;
        const docRef = await addDoc(collection(db, `festivals/${festivalId}/stowage_items`), dataWithoutId);
        return docRef.id;
      },

      async toArray() {
        const snapshot = await getDocsFromServer(collection(db, `festivals/${festivalId}/stowage_items`));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },

      async get(id) {
        const docRef = doc(db, `festivals/${festivalId}/stowage_items`, String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      },

      async update(id, data) {
        await updateDoc(doc(db, `festivals/${festivalId}/stowage_items`, String(id)), data);
      },

      async delete(id) {
        await deleteDoc(doc(db, `festivals/${festivalId}/stowage_items`, String(id)));
      },

      where(field, operator, value) {
        return {
          async toArray() {
            const q = query(
              collection(db, `festivals/${festivalId}/stowage_items`),
              fbWhere(field, operator === 'equals' ? '==' : operator, value)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        };
      }
    }
  };
}