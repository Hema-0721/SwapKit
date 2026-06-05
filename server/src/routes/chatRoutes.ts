import { Router } from 'express';
import { getThreads, getMessages, sendMessage } from '../controllers/chatController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/threads', getThreads);
router.get('/threads/:threadId/messages', getMessages);
router.post('/messages', sendMessage);

export default router;
