import express from 'express';
import { admin, db } from '../config/firebase.js';

const router = express.Router();

/**
 * POST /api/auth/sync
 * Sync Firebase user with Firestore
 * On signup: creates/updates user with provided name & role
 * On login: fetches existing user from DB
 */
router.post('/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (tokenError) {
      console.error("[Auth Sync] Token verification failed:", tokenError.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userRef = db.collection("users").doc(decoded.uid);
    const existingDoc = await userRef.get();

    // If user exists and no new role provided, it's a simple login sync
    if (existingDoc.exists && !req.body.role) {
      return res.status(200).json({
        success: true,
        message: "User data retrieved successfully",
        data: { id: existingDoc.id, ...existingDoc.data() },
      });
    }

    // For new users or role updates, ensure required fields exist
    const { name, role, skills, location } = req.body;

    if (!existingDoc.exists && (!name || !role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Full profile (name and role) required for initial sync" 
      });
    }

    const userData = {
      uid: decoded.uid,
      email: decoded.email,
      updatedAt: new Date(),
    };

    if (name) userData.name = name;
    if (role) {
      if (!["ngo", "volunteer", "admin"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }
      userData.role = role;
    }
    if (skills) userData.skills = skills;
    if (location) userData.location = location;

    if (!existingDoc.exists) {
      userData.createdAt = new Date();
    }

    await userRef.set(userData, { merge: true });

    const finalDoc = await userRef.get();
    res.status(200).json({
      success: true,
      message: existingDoc.exists ? "User profile updated" : "User created and synced",
      data: { id: finalDoc.id, ...finalDoc.data() },
    });

  } catch (error) {
    console.error("[Auth Sync] Fatal error:", error);
    res.status(500).json({ success: false, message: "Server error during synchronization" });
  }
});

export default router;
