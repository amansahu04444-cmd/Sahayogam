import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  getVolunteerRequests,
  getNGORequests,
  getAvailableVolunteers,
} from '../controllers/taskRequestController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * Task Request Routes
 */

// Get list of available volunteers (NGO browses to assign)
router.get('/volunteers', getAvailableVolunteers);

// Send invitation to a volunteer (NGO action)
router.post('/invite', sendInvitation);

// Get requests sent by this NGO
router.get('/ngo', getNGORequests);

// Get invitations received by this volunteer
router.get('/volunteer', getVolunteerRequests);

// Accept an invitation (volunteer action)
router.post('/:requestId/accept', acceptInvitation);

// Reject an invitation (volunteer action)
router.post('/:requestId/reject', rejectInvitation);

export default router;
