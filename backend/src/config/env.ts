import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  MONGO_URI: string;
  AI_PROVIDER: 'gemini' | 'deepseek' | 'openai';
  GEMINI_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  OPENAI_API_KEY: string;
  GEMINI_MODEL: string;
  DEEPSEEK_MODEL: string;
  OPENAI_MODEL: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
  MAX_CONTEXT_CHAR_LIMIT: number;
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const val = process.env[key];
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const config: EnvConfig = {
  PORT: getEnvNumber('PORT', 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/contextly',
  AI_PROVIDER: (process.env.AI_PROVIDER as 'gemini' | 'deepseek' | 'openai') || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  RATE_LIMIT_MAX: getEnvNumber('RATE_LIMIT_MAX', 60),
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
  MAX_CONTEXT_CHAR_LIMIT: getEnvNumber('MAX_CONTEXT_CHAR_LIMIT', 12000),
};
