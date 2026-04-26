import { db } from '../config/firebase.js';
import * as notificationService from '../services/notificationService.js';
import * as taskService from '../services/taskService.js';

/**
 * Send task invitation to volunteer
 * POST /api/notifications/invite
 */
export const sendTaskInvitation = async (req, res) => {
  try {
    const { taskId, volunteerId, taskTitle, ngoId, ngoName } = req.body;
    const senderId = req.user.uid;
    const senderName = req.user.name || 'NGO';

    const notification = {
      type: "task_invitation",
      taskId: taskId,
      taskTitle: taskTitle,
      ngoId: ngoId || senderId,
      ngoName: ngoName || senderName,
      receiverId: volunteerId,
      senderId: senderId,
      senderName: senderName,
      messagePreview: `You have been invited to a task: ${taskTitle}`,
      status: "pending",
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('notifications').add(notification);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: { id: docRef.id, ...notification }
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invitation'
    });
  }
};

/**
 * Handle invitation response (Accept/Reject)
 * PATCH /api/notifications/:id/respond
 */
export const respondToInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const volunteerId = req.user.uid;

    const notificationRef = db.collection('notifications').doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const notification = notificationDoc.data();
    if (notification.receiverId !== volunteerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update notification status
    await notificationRef.update({
      status,
      isRead: true,
      updatedAt: new Date().toISOString()
    });

    if (status === 'accepted') {
      // Update task assignment
      const volunteerDetails = {
        name: req.user.name || req.user.displayName || 'Volunteer',
        email: req.user.email || '',
        phone: req.user.phone || ''
      };

      await taskService.acceptVolunteer(notification.taskId, volunteerId, volunteerDetails);
    }

    res.json({
      success: true,
      message: `Invitation ${status} successfully`
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to invitation'
    });
  }
};

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('notifications')
      .where('receiverId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications'
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.uid;
    const count = await notificationService.getUnreadNotificationCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count'
    });
  }
};

/**
 * Get task invitations for current user
 * GET /api/notifications/invitations
 */
export const getInvitations = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('notifications')
      .where('receiverId', '==', userId)
      .where('type', '==', 'task_invitation')
      .orderBy('createdAt', 'desc')
      .get();

    const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get invitations'
    });
  }
};
