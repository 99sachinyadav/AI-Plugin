import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';

const router = Router();

router.post('/', ConversationController.create);
router.get('/', ConversationController.list);
router.get('/:id', ConversationController.getById);
router.delete('/:id', ConversationController.delete);
router.patch('/:id', ConversationController.update);
router.post('/:id/context', ConversationController.addContext);
router.delete('/:id/context/:contextId', ConversationController.removeContext);

export default router;
