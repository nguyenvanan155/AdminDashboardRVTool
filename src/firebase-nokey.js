import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const nokeyConfig = {
  databaseURL: 'https://mainrvtool-default-rtdb.asia-southeast1.firebasedatabase.app',
};

// Use a separate app name "nokey" to avoid conflict with the default Firebase app
const nokeyApp = initializeApp(nokeyConfig, 'nokey');
export const dbNokey = getDatabase(nokeyApp);
