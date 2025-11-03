import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../../constants';

// Firebase 초기화
export const app = initializeApp(FIREBASE_CONFIG);

// Firestore 데이터베이스
export const db = getFirestore(app);

// Firebase Storage
export const storage = getStorage(app);
