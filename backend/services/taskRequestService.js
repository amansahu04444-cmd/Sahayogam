/**
 * Task Request Service
 * Handles task invitations sent by NGOs to volunteers
 */

import { db } from '../config/firebase.js';

const TASK_REQUESTS_COLLECTION = 'taskRequests';

/**
 * Send a task invitation from NGO to a volunteer
 * Creates a pending request and a notification for the volunteer
 */
export const sendTaskInvitation = async (taskId, ngoId, ngoName, volunteerId, volunteerName, task, senderId) => {
  try {
    console.log('[TaskRequest] Sending invitation:', { taskId, ngoId, volunteerId });

    // Verify sender is the NGO that owns this task
    if (senderId !== ngoId) {
      throw new Error('Unauthorized: Only the NGO can send invitations for this task');
    }

    // Check if there's already a pending request for this volunteer and task
    const existingSnapshot = await db.collection(TASK_REQUESTS_COLLECTION)
      .where('taskId', '==', taskId)
      .where('volunteerId', '==', volunteerId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      throw new Error('A pending invitation already exists for this volunteer');
    }

    // Check if volunteer already accepted this task
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (taskDoc.exists) {
      const taskData = taskDoc.data();
      const alreadyAccepted = taskData.acceptedVolunteers?.some(v => v.id === volunteerId);
      if (alreadyAccepted) {
        throw new Error('Volunteer has already been assigned to this task');
      }
    }

    // Create task request document
    const taskRequest = {
      taskId,
      taskTitle: task.title,
      taskDescription: task.description,
      taskCategory: task.category,
      taskLocation: task.location?.address || null,
      ngoId,
      ngoName,
      volunteerId,
      volunteerName,
      status: 'pending', // pending | accepted | rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const requestRef = await db.collection(TASK_REQUESTS_COLLECTION).add(taskRequest);
    console.log('[TaskRequest] Created request:', requestRef.id);

    // Create notification for the volunteer
    const notification = {
      type: 'TASK_INVITATION',
      receiverId: volunteerId,
      senderId: ngoId,
      senderName: ngoName,
      senderRole: 'ngo',
      taskId,
      taskTitle: task.title,
      message: `You have been invited to join: ${task.title}`,
      messagePreview: task.description?.substring(0, 80) + '...' || task.title,
      category: task.category,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const notifRef = await db.collection('notifications').add(notification);
    console.log('[TaskRequest] Created notification:', notifRef.id);

    return {
      id: requestRef.id,
      ...taskRequest,
      notificationId: notifRef.id,
    };
  } catch (error) {
    console.error('[TaskRequest] Error sending invitation:', error.message);
    throw error;
  }
};

/**
 * Accept a task invitation
 * Updates request status and adds volunteer to task's acceptedVolunteers array
 */
export const acceptTaskInvitation = async (requestId, volunteerId) => {
  try {
    console.log('[TaskRequest] Accepting invitation:', { requestId, volunteerId });

    // Get the request document
    const requestDoc = await db.collection(TASK_REQUESTS_COLLECTION).doc(requestId).get();
    if (!requestDoc.exists) {
      throw new Error('Task request not found');
    }

    const request = requestDoc.data();

    // Verify the volunteer accepting is the one invited
    if (request.volunteerId !== volunteerId) {
      throw new Error('Unauthorized: You are not the invited volunteer');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot accept request with status: ${request.status}`);
    }

    // Update request status
    await db.collection(TASK_REQUESTS_COLLECTION).doc(requestId).update({
      status: 'accepted',
      updatedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    });

    // Add volunteer to task's acceptedVolunteers array
    const taskRef = db.collection('tasks').doc(request.taskId);
    const taskDoc = await taskRef.get();

    if (taskDoc.exists) {
      const taskData = taskDoc.data();
      const currentVolunteers = taskData.acceptedVolunteers || [];

      // Check if already added
      const alreadyAdded = currentVolunteers.some(v => v.id === volunteerId);
      if (!alreadyAdded) {
        await taskRef.update({
          acceptedVolunteers: [...currentVolunteers, {
            id: volunteerId,
            name: request.volunteerName,
            email: '', // Will be populated if available
            acceptedAt: new Date().toISOString(),
          }],
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Mark notification as read
    const notifSnapshot = await db.collection('notifications')
      .where('taskId', '==', request.taskId)
      .where('receiverId', '==', volunteerId)
      .where('type', '==', 'TASK_INVITATION')
      .where('isRead', '==', false)
      .get();

    const batch = db.batch();
    notifSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true, readAt: new Date().toISOString() });
    });
    if (!notifSnapshot.empty) {
      await batch.commit();
    }

    console.log('[TaskRequest] Successfully accepted invitation');
    return { success: true, requestId, taskId: request.taskId };
  } catch (error) {
    console.error('[TaskRequest] Error accepting invitation:', error.message);
    throw error;
  }
};

/**
 * Reject a task invitation
 */
export const rejectTaskInvitation = async (requestId, volunteerId) => {
  try {
    console.log('[TaskRequest] Rejecting invitation:', { requestId, volunteerId });

    const requestDoc = await db.collection(TASK_REQUESTS_COLLECTION).doc(requestId).get();
    if (!requestDoc.exists) {
      throw new Error('Task request not found');
    }

    const request = requestDoc.data();

    if (request.volunteerId !== volunteerId) {
      throw new Error('Unauthorized: You are not the invited volunteer');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot reject request with status: ${request.status}`);
    }

    await db.collection(TASK_REQUESTS_COLLECTION).doc(requestId).update({
      status: 'rejected',
      updatedAt: new Date().toISOString(),
      rejectedAt: new Date().toISOString(),
    });

    // Mark notification as read
    const notifSnapshot = await db.collection('notifications')
      .where('taskId', '==', request.taskId)
      .where('receiverId', '==', volunteerId)
      .where('type', '==', 'TASK_INVITATION')
      .where('isRead', '==', false)
      .get();

    const batch = db.batch();
    notifSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true, readAt: new Date().toISOString() });
    });
    if (!notifSnapshot.empty) {
      await batch.commit();
    }

    console.log('[TaskRequest] Successfully rejected invitation');
    return { success: true, requestId };
  } catch (error) {
    console.error('[TaskRequest] Error rejecting invitation:', error.message);
    throw error;
  }
};

/**
 * Get task requests for a volunteer (their pending invitations)
 */
export const getVolunteerTaskRequests = async (volunteerId) => {
  try {
    const snapshot = await db.collection(TASK_REQUESTS_COLLECTION)
      .where('volunteerId', '==', volunteerId)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt descending
    requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return requests;
  } catch (error) {
    console.error('[TaskRequest] Error getting volunteer requests:', error.message);
    throw error;
  }
};

/**
 * Get task requests for an NGO (sent invitations)
 */
export const getNGOTaskRequests = async (ngoId) => {
  try {
    const snapshot = await db.collection(TASK_REQUESTS_COLLECTION)
      .where('ngoId', '==', ngoId)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt descending
    requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return requests;
  } catch (error) {
    console.error('[TaskRequest] Error getting NGO requests:', error.message);
    throw error;
  }
};

/**
 * Get a single task request by ID
 */
export const getTaskRequest = async (requestId) => {
  try {
    const doc = await db.collection(TASK_REQUESTS_COLLECTION).doc(requestId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[TaskRequest] Error getting request:', error.message);
    throw error;
  }
};
