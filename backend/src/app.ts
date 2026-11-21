import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import providerRoutes from './routes/provider.routes';
import conversationRoutes from './routes/conversation.routes';
import chatRoutes from './routes/chat.routes';
import { errorHandler } from './middleware/error.middleware';
import { config } from './config/env';

export const createApp = (): express.Application => {
  const app = express();

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // For Chrome extension compatibility
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS Middleware
  app.use(cors({
    origin: '*', // Allow extension chrome-extension:// origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  }));

  // Body Parser with payload limit protection
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'Contextly Backend API',
      version: '1.0.0',
      activeProvider: config.AI_PROVIDER,
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/providers', providerRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/chat', chatRoutes);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
