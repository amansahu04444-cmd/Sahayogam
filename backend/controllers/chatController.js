import { db, admin } from '../config/firebase.js';

export const sendMessage = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { message, receiverId, receiverRole } = req.body;

    // 1. Debug logs
    console.log("[chatController] User:", req.user);
    console.log("[chatController] Params:", req.params);
    console.log("[chatController] Body:", req.body);

    // 2. Validate inputs
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!chatId || chatId === 'undefined') {
      return res.status(400).json({ success: false, message: 'chatId required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const userId = req.user.uid;
    const userName = req.user.name || req.user.displayName || 'User';
    const userRole = req.user.role;

    // 3. Check Firestore queries safely
    const chatDoc = await db.collection('chats').doc(chatId).get();

    if (!chatDoc.exists) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const chatData = chatDoc.data();

    // ALLOW BOTH NGO & VOLUNTEER
    if (chatData.ngoId !== userId && chatData.volunteerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Not a participant'
      });
    }

    // 4. Add message to messages collection
    const messageData = {
      chatId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole || 'volunteer',
      receiverId: receiverId || null,
      text: message.trim(),
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const msgRef = await db.collection('messages').add(messageData);

    // 5. Update chat last message
    await db.collection('chats').doc(chatId).update({
      lastMessage: message.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send Notification (optional based on receiver)
    if (receiverId) {
      await db.collection('notifications').add({
        receiverId,
        receiverRole: receiverRole || 'ngo',
        senderId: userId,
        senderName: userName,
        senderRole: userRole || 'volunteer',
        chatId,
        type: 'CHAT_MESSAGE',
        messagePreview: message.length > 80 ? message.slice(0, 80) + '…' : message,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { id: msgRef.id }
    });

  } catch (error) {
    console.error('API ERROR [chatController.sendMessage]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user.uid;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId required' });
    }

    const chatDoc = await db.collection('chats').doc(chatId).get();

    if (!chatDoc.exists) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const chatData = chatDoc.data();

    // Verify user is a participant
    if (chatData.ngoId !== userId && chatData.volunteerId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete all messages in the chat
    const messagesSnapshot = await db
      .collection('messages')
      .where('chatId', '==', chatId)
      .get();

    const batch = db.batch();
    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Also delete any notifications related to this chat
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('chatId', '==', chatId)
      .get();
    
    notificationsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Delete the chat document itself
    await db.collection('chats').doc(chatId).delete();

    res.json({
      success: true,
      message: 'Chat and associated messages deleted successfully'
    });

  } catch (error) {
    console.error('API ERROR [chatController.deleteChat]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete chat'
    });
  }
};

