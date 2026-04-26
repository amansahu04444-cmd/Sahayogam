import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { authenticate, volunteerOnly, ngoOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/volunteers
 * Get all volunteers
 */
router.get('/', userController.getAllVolunteers);

export default router;
