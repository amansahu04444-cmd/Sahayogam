import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Get all notifications for current user
 */
router.get('/', notificationController.getMyNotifications);
router.get('/count', notificationController.getUnreadCount);
router.get('/invitations', notificationController.getInvitations);

/**
 * POST /api/notifications/invite
 * Send task invitation (NGO only)
 */
router.post('/invite', notificationController.sendTaskInvitation);

/**
 * PATCH /api/notifications/:id/respond
 * Respond to task invitation (Accept/Reject)
 */
router.patch('/:id/respond', notificationController.respondToInvitation);

export default router;
