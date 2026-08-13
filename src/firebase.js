// Firebase configuration for Auto-seller Admin Dashboard
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  databaseURL: 'https://admin-reviewtool-default-rtdb.asia-southeast1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
