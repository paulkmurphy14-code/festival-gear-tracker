import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0xA2L-ilrjPb8sk950yBuPusScPPi148",
  authDomain: "festival-gear-tracker.firebaseapp.com",
  projectId: "festival-gear-tracker",
  storageBucket: "festival-gear-tracker.firebasestorage.app",
  messagingSenderId: "1088699436087",
  appId: "1:1088699436087:web:0dc9ccb6dcab6fdc8983b2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available in this browser');
  }
});

export default app;