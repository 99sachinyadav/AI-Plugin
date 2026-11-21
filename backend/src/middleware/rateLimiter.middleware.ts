import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const chatRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // Default: 1 minute
  max: config.RATE_LIMIT_MAX, // Default: 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many chat requests from this IP. Please wait a moment before sending more messages.',
  },
});
