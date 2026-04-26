/**
 * Notification Service
 * Handles notifications when volunteers are assigned to tasks
 * AND when new chat messages are received
 */

import { db } from '../config/firebase.js';

/**
 * Send notification when a volunteer is assigned
 * Currently logs to console (can be extended with email, push, SMS)
 */
export const sendAssignmentNotification = async (volunteer, task) => {
  const notification = {
    type: 'TASK_ASSIGNED',
    volunteerId: volunteer.id,
    volunteerName: volunteer.name,
    volunteerEmail: volunteer.email,
    taskId: task.id,
    taskTitle: task.title,
    message: `You have been assigned to: ${task.title}`,
    timestamp: new Date().toISOString(),
  };

  // Log notification (in production, integrate with email/push service)
  console.log('='.repeat(50));
  console.log('NOTIFICATION: TASK ASSIGNMENT');
  console.log('='.repeat(50));
  console.log(`Volunteer: ${volunteer.name} (${volunteer.email})`);
  console.log(`Task: ${task.title} (ID: ${task.id})`);
  console.log(`Category: ${task.category}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Location: ${task.location?.address || 'Not specified'}`);
  console.log(`Time: ${notification.timestamp}`);
  console.log('='.repeat(50));

  // In production, you would integrate with:
  // - Email service (SendGrid, AWS SES)
  // - Push notifications (Firebase Cloud Messaging)
  // - SMS (Twilio)
  // - In-app notifications

  return notification;
};

/**
 * Create a Firestore notification for new chat messages
 * Called from chatService.sendMessage() after a message is saved
 */
export const createChatNotification = async (chatId, taskId, senderId, senderName, senderRole, receiverId, messagePreview) => {
  try {
    console.log('[Notification] Creating chat notification:', {
      chatId,
      taskId,
      senderId,
      senderName,
      senderRole,
      receiverId,
      messagePreview
    });

    const notification = {
      type: 'NEW_MESSAGE',
      chatId,
      taskId,
      senderId,
      senderName,
      senderRole,
      receiverId,
      messagePreview: messagePreview.substring(0, 100), // Truncate for display
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // Write to Firestore notifications collection
    const docRef = await db.collection('notifications').add(notification);

    console.log('[Notification] Chat notification created:', docRef.id);
    console.log('[Notification] Receiver ID:', receiverId);
    console.log('[Notification] Sender:', senderName, `(${senderRole})`);

    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('[Notification] Error creating chat notification:', error.message);
    // Don't throw - notification failure shouldn't break chat
    return null;
  }
};

/**
 * Mark all notifications for a user as read
 * Called when user opens chat or clicks on notification
 */
export const markNotificationsAsRead = async (userId, chatId = null) => {
  try {
    console.log('[Notification] Marking notifications as read:', { userId, chatId });

    let query = db.collection('notifications')
      .where('receiverId', '==', userId)
      .where('isRead', '==', false);

    if (chatId) {
      query = query.where('chatId', '==', chatId);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log('[Notification] No unread notifications to mark');
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    console.log(`[Notification] Marked ${snapshot.docs.length} notifications as read`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('[Notification] Error marking notifications as read:', error.message);
    return 0;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('receiverId', '==', userId)
      .where('isRead', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('[Notification] Error getting unread count:', error.message);
    return 0;
  }
};

/**
 * Send notification for task status change
 */
export const sendStatusChangeNotification = async (volunteer, task, oldStatus, newStatus) => {
  console.log('='.repeat(50));
  console.log('NOTIFICATION: TASK STATUS CHANGE');
  console.log('='.repeat(50));
  console.log(`Volunteer: ${volunteer.name}`);
  console.log(`Task: ${task.title}`);
  console.log(`Status: ${oldStatus} -> ${newStatus}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  return {
    type: 'STATUS_CHANGED',
    volunteerId: volunteer.id,
    taskId: task.id,
    oldStatus,
    newStatus,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Send high priority alert
 */
export const sendHighPriorityAlert = async (task, volunteers) => {
  console.log('='.repeat(50));
  console.log('ALERT: HIGH PRIORITY TASK');
  console.log('='.repeat(50));
  console.log(`Task: ${task.title}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Affected People: ${task.peopleAffected}`);
  console.log(`Urgency: ${task.urgency}`);
  console.log(`Volunteers Available: ${volunteers.length}`);
  console.log('='.repeat(50));

  return {
    type: 'HIGH_PRIORITY_ALERT',
    taskId: task.id,
    priority: task.priority,
    volunteersNotified: volunteers.length,
    timestamp: new Date().toISOString(),
  };
};
