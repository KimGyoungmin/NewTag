import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../../constants';

// Firebase initialization
export const app = initializeApp(FIREBASE_CONFIG);

// Firestore database
export const db = getFirestore(app);

// Firebase Storage
export const storage = getStorage(app);

// Use local Firebase emulators in development when enabled via env
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
if (useEmulator) {
  const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
  const firestorePort = Number(import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE_PORT) || 8080;
  const storagePort = Number(import.meta.env.VITE_FIREBASE_EMULATOR_STORAGE_PORT) || 9199;

  connectFirestoreEmulator(db, host, firestorePort);
  connectStorageEmulator(storage, host, storagePort);
}
