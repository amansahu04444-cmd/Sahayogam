import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ── VALIDATE ENVIRONMENT VARIABLES ──────────────────────────────
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (key) => !import.meta.env[key]
);

if (missingVars.length > 0) {
  const errorMsg = `
    ❌ FIREBASE CONFIGURATION ERROR
    Missing environment variables: ${missingVars.join(', ')}
    
    Fix: Create a .env file in the frontend/ directory with these variables:
    ${requiredEnvVars.map((v) => `${v}=your_value_here`).join('\n')}
    
    Then restart your dev server.
  `;
  console.error(errorMsg);
  throw new Error(`Firebase config error: Missing variables [${missingVars.join(', ')}]`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── DEBUG LOGGING (remove in production) ────────────────────────
if (import.meta.env.DEV) {
  console.log(
    '🔧 Firebase Config Loaded:',
    {
      apiKey: firebaseConfig.apiKey ? '✓ Present' : '✗ Missing',
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId ? '✓ Present' : '✗ Missing',
    }
  );
}

// ── INITIALIZE FIREBASE ─────────────────────────────────────────
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw error;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
