import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/stream', chatRateLimiter, ChatController.streamChat);
router.post('/', chatRateLimiter, ChatController.standardChat);

export default router;
