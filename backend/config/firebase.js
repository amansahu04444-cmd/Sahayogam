import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
} catch (error) {
  console.error("❌ Failed to read service account file:", error.message);
  throw new Error("serviceAccountKey.json not found or invalid");
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
}

// Export db (Firestore instance) - using Firebase Admin SDK v13+ pattern
const db = admin.firestore();
export { db, admin };
