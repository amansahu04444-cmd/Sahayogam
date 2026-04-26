import { admin, db } from '../config/firebase.js';
import { UserRoles } from '../models/User.js';

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and attaches decoded user data to req.user
 * Uses Firebase Admin SDK - no JWT library involved
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Fetch user role from Firestore
      let role = UserRoles.VOLUNTEER; // Default
      
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        role = userDoc.data().role;
      }

      req.user = {
        ...decodedToken,
        role: role
      };
      
      next();
    } catch (error) {
      console.error('Firebase Auth Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * Check if user has required role(s)
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Allow only NGOs
 */
export const ngoOnly = authorize(UserRoles.NGO);

/**
 * Allow only Volunteers
 */
export const volunteerOnly = authorize(UserRoles.VOLUNTEER);

/**
 * Allow only Admins
 */
export const adminOnly = authorize(UserRoles.ADMIN);

/**
 * Allow NGOs or Admins
 */
export const ngoOrAdmin = authorize(UserRoles.NGO, UserRoles.ADMIN);

/**
 * Protect Middleware Alias (Firebase Authentication)
 * Verifies Firebase ID tokens - no JWT library involved
 * Used to protect routes across the backend
 */
export const protect = authenticate;
