import { db } from '../config/firebase.js';
import { UserRoles } from '../models/User.js';

const USERS_COLLECTION = 'users';

/**
 * Sync user data with Firestore
 * Called when a user logs in via Firebase on the frontend
 */
export const syncUserWithFirestore = async (userData) => {
  const { uid, email, name, role, skills, location } = userData;

  const user = {
    uid,
    email,
    name: name || '',
    role: role || UserRoles.VOLUNTEER,
    skills: skills || [],
    location: location || { lat: 0, lng: 0, address: '' },
    updatedAt: new Date().toISOString(),
  };

  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    user.createdAt = new Date().toISOString();
    await userRef.set(user);
  } else {
    await userRef.update(user);
  }

  return { id: uid, ...user };
};

/**
 * Get user by UID
 */
export const getUserById = async (uid) => {
  const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (!userDoc.exists) throw new Error('User not found');
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Update user profile
 */
export const updateUser = async (uid, updates) => {
  const { name, skills, location, availability } = updates;

  const updateData = {
    ...(name && { name }),
    ...(skills && { skills }),
    ...(location && { location }),
    ...(availability && { availability }),
    updatedAt: new Date().toISOString(),
  };

  await db.collection(USERS_COLLECTION).doc(uid).update(updateData);
  return getUserById(uid);
};

/**
 * Get all volunteers
 */
export const getAllVolunteers = async () => {
  const snapshot = await db.collection(USERS_COLLECTION)
    .where('role', '==', UserRoles.VOLUNTEER)
    .get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
/**
 * Get volunteers by skill (category matching)
 */
export const getVolunteersBySkill = async (skill) => {
  const snapshot = await db.collection(USERS_COLLECTION)
    .where('role', '==', UserRoles.VOLUNTEER)
    .where('skills', 'array-contains', skill)
    .get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
