import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller';

const router = Router();

router.get('/', ProviderController.getProviders);

export default router;
