import admin from "firebase-admin";
import dotenv from "dotenv";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

// Ensure environment variables are loaded
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Firebase Admin Initialization
 * Strategy:
 * 1. Prefer individual env vars (FIREBASE_PROJECT_ID, etc.) — used in production (Render)
 * 2. Fall back to serviceAccountKey.json — used locally when env vars aren't set
 */

const initializeFirebaseAdmin = () => {
  try {
    // 1. Check if already initialized (safe against nodemon restarts)
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // 2. If env vars are set — use them (production mode)
    if (projectId && clientEmail && privateKey) {
      // Handle escaped newlines from Render/Vercel environment variable formatting
      const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });

      console.log("✅ Firebase Admin initialized from environment variables");
      return admin.app();
    }

    // 3. Fall back to serviceAccountKey.json (local development)
    const keyPath = path.join(__dirname, "../serviceAccountKey.json");
    try {
      const require = createRequire(import.meta.url);
      const serviceAccount = require(keyPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("✅ Firebase Admin initialized from serviceAccountKey.json (local dev)");
      return admin.app();
    } catch (fileError) {
      console.error("❌ Firebase Admin: No credentials found.");
      console.error("   → For production: Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
      console.error("   → For local dev: Ensure serviceAccountKey.json exists in /backend");
      return null;
    }

  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    return null;
  }
};

const app = initializeFirebaseAdmin();
const db = app ? admin.firestore() : null;

export { db, admin, app };