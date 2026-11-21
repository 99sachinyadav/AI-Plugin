export type ChatMode = 'general' | 'context';

export interface ContextSource {
  _id?: string;
  id?: string;
  title: string;
  url: string;
  selectedText: string;
  sourceType?: string;
  createdAt?: string;
}

export interface Message {
  _id?: string;
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  createdAt: string;
  isStreaming?: boolean;
}

export interface Conversation {
  _id?: string;
  id?: string;
  sessionId: string;
  title: string;
  mode: ChatMode;
  provider: string;
  contextSources: ContextSource[];
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  defaultModel: string;
  supportedModels: string[];
  isConfigured: boolean;
  isDefault: boolean;
}

export interface PendingContext {
  title: string;
  url: string;
  selectedText: string;
  sourceType?: string;
  timestamp: number;
}

// ─── DevTools Capture Types ───────────────────────────────────────────────────

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface CapturedNetworkEntry {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  type: string;
  size: number;
  duration: number;
  requestBody?: string;
  responseBody?: string;
  timestamp: number;
}

export interface CapturedConsoleEntry {
  id: string;
  level: ConsoleLevel;
  message: string;
  url?: string;
  timestamp: number;
}
