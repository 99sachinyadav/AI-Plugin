import mongoose from 'mongoose';
import { createApp } from './app';
import { config } from './config/env';
import { AIProviderFactory } from './providers/AIProviderFactory';
import { setServers } from "node:dns/promises";


setServers(["1.1.1.1", "8.8.8.8"]);
const app = createApp();

async function startServer() {
  try {
    // Initialize AI Providers
    AIProviderFactory.initialize();
    console.log(`[Contextly] AI Providers initialized. Default provider: ${config.AI_PROVIDER}`);

    // Connect to MongoDB asynchronously without blocking server startup
    mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    }).then(() => {
      console.log('[Contextly] Connected to MongoDB database successfully.');
    }).catch((mongoError: any) => {
      console.warn(`[Contextly] Note: MongoDB connection failed (${mongoError.message}). Operating in in-memory persistence mode.`);
    });

    // Start Express server immediately
    const server = app.listen(config.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Contextly Backend API running on port ${config.PORT}`);
      console.log(`   Health check: http://localhost:${config.PORT}/api/health`);
      console.log(`   Providers:    http://localhost:${config.PORT}/api/providers`);
      console.log(`   Default AI:   ${config.AI_PROVIDER.toUpperCase()}`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async () => {
      console.log('\n[Contextly] Shutting down server gracefully...');
      server.close(async () => {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('[Contextly] MongoDB connection closed.');
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('[Contextly] Fatal server startup error:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
