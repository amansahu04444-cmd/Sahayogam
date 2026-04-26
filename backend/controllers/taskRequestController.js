import * as taskRequestService from '../services/taskRequestService.js';
import { db } from '../config/firebase.js';

/**
 * Send a task invitation to a volunteer
 * POST /api/task-requests/invite
 */
export const sendInvitation = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { taskId, volunteerId, volunteerName, task } = req.body;
    const ngoId = req.user.uid;
    const ngoName = req.user.displayName || 'NGO';

    if (!taskId || !volunteerId || !task) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: taskId, volunteerId, task',
      });
    }

    const result = await taskRequestService.sendTaskInvitation(
      taskId,
      ngoId,
      ngoName,
      volunteerId,
      volunteerName,
      task,
      ngoId
    );

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('[TaskRequest] Send invitation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send invitation',
    });
  }
};

/**
 * Accept a task invitation
 * POST /api/task-requests/:requestId/accept
 */
export const acceptInvitation = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { requestId } = req.params;
    const volunteerId = req.user.uid;

    const result = await taskRequestService.acceptTaskInvitation(requestId, volunteerId);

    res.json({
      success: true,
      message: 'Task invitation accepted',
      data: result,
    });
  } catch (error) {
    console.error('[TaskRequest] Accept error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept invitation',
    });
  }
};

/**
 * Reject a task invitation
 * POST /api/task-requests/:requestId/reject
 */
export const rejectInvitation = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { requestId } = req.params;
    const volunteerId = req.user.uid;

    const result = await taskRequestService.rejectTaskInvitation(requestId, volunteerId);

    res.json({
      success: true,
      message: 'Task invitation rejected',
      data: result,
    });
  } catch (error) {
    console.error('[TaskRequest] Reject error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject invitation',
    });
  }
};

/**
 * Get task requests for current volunteer
 * GET /api/task-requests/volunteer
 */
export const getVolunteerRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const volunteerId = req.user.uid;
    const requests = await taskRequestService.getVolunteerTaskRequests(volunteerId);

    res.json({
      success: true,
      message: 'Requests retrieved',
      data: requests,
    });
  } catch (error) {
    console.error('[TaskRequest] Get volunteer requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get requests',
    });
  }
};

/**
 * Get task requests for current NGO
 * GET /api/task-requests/ngo
 */
export const getNGORequests = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const ngoId = req.user.uid;
    const requests = await taskRequestService.getNGOTaskRequests(ngoId);

    res.json({
      success: true,
      message: 'Requests retrieved',
      data: requests,
    });
  } catch (error) {
    console.error('[TaskRequest] Get NGO requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get requests',
    });
  }
};

/**
 * Get all available volunteers (for NGO to browse)
 * GET /api/task-requests/volunteers
 */
export const getAvailableVolunteers = async (req, res) => {
  try {
    // Query users collection for volunteers
    const snapshot = await db.collection('users')
      .where('role', '==', 'volunteer')
      .get();

    const volunteers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Don't expose sensitive data
      email: doc.data().email || '',
      skills: doc.data().skills || [],
      location: doc.data().location || {},
    }));

    res.json({
      success: true,
      message: 'Volunteers retrieved',
      data: volunteers,
    });
  } catch (error) {
    console.error('[TaskRequest] Get volunteers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get volunteers',
    });
  }
};
