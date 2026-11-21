import { Request, Response, NextFunction } from 'express';
import { AIProviderFactory } from '../providers/AIProviderFactory';
import { config } from '../config/env';

export class ProviderController {
  static getProviders(req: Request, res: Response, next: NextFunction): void {
    try {
      const providers = AIProviderFactory.getRegisteredProvidersInfo();
      res.json({
        success: true,
        defaultProvider: config.AI_PROVIDER,
        providers,
      });
    } catch (error) {
      next(error);
    }
  }
}
