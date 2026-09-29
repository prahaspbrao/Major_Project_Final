import express from 'express';
import {
  createSession,
  getSessions,
  getMessages,
  postMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/sessions').post(createSession).get(getSessions);
router.route('/sessions/:sessionId/messages').get(getMessages).post(postMessage);

export default router;
