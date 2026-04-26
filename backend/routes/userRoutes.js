import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { authenticate, volunteerOnly, ngoOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', userController.getProfile);

/**
 * PUT /api/users/update
 * Update current user profile
 */
router.put(
  '/update',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('skills').optional().isArray(),
    body('location').optional().isObject(),
    body('availability').optional().isObject(),
  ],
  userController.updateProfile
);
/**
 * GET /api/users/volunteers/skill/:skill
 * Get volunteers by skill (NGO only)
 */
router.get('/volunteers/skill/:skill', ngoOrAdmin, userController.getVolunteersBySkill);

export default router;
