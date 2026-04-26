import admin from "firebase-admin";
import config from "./index.js";

const serviceAccount = {
  type: "service_account",
  project_id: config.firebase.projectId,
  client_email: config.firebase.clientEmail,
  private_key: config.firebase.privateKey,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
  }
}

const db = admin.firestore();

export { db, admin };