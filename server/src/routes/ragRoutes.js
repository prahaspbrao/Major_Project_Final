import express from 'express';
import { searchRAGDirect, getSystemStatus } from '../controllers/ragController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/search', protect, searchRAGDirect);

export default router;
