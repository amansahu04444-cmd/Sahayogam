import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/chats/:id/messages
 * Send a new message in a chat
 */
router.post('/:id/messages', chatController.sendMessage);

/**
 * DELETE /api/chats/:id
 * Delete a chat and all its messages
 */
router.delete('/:id', chatController.deleteChat);

export default router;
