import admin from "firebase-admin";

const serviceAccount = {
  type: "service_account",
  project_id: process.env.project_id,
  client_email: process.env.client_email,
  private_key: process.env.private_key.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized successfully");
}

const db = admin.firestore();

export { db, admin };