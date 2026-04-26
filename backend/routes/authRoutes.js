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
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userRef = db.collection("users").doc(decoded.uid);

    // Check if user already exists
    const existingDoc = await userRef.get();

    if (existingDoc.exists && !req.body.role) {
      // Login case: user already synced, just return existing data
      return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: { id: existingDoc.id, ...existingDoc.data() },
      });
    }

    // Signup case: name and role are required
    if (!req.body.name || !req.body.role) {
      return res.status(400).json({ message: "Missing name or role" });
    }

    if (!["ngo", "volunteer"].includes(req.body.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userData = {
      uid: decoded.uid,
      name: req.body.name,
      email: decoded.email,
      role: req.body.role,
      skills: req.body.skills || [],
      location: req.body.location || {},
      updatedAt: new Date(),
    };

    if (!existingDoc.exists) {
      userData.createdAt = new Date();
    }

    await userRef.set(userData, { merge: true });

    const userDoc = await userRef.get();

    res.status(200).json({
      success: true,
      message: "User synced successfully",
      data: { id: userDoc.id, ...userDoc.data() },
    });

  } catch (error) {
    console.error("Sync Error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

export default router;
