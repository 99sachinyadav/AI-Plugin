import { Conversation, Message, AIProviderInfo, ContextSource } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

export class ApiService {
  private static async getBaseUrl(): Promise<string> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(['apiUrl']);
        if (stored && stored.apiUrl) {
          return stored.apiUrl.replace(/\/+$/, '');
        }
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_API_BASE_URL;
  }

  static async getHealth(): Promise<{ status: string; activeProvider: string } | null> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async getProviders(): Promise<{ defaultProvider: string; providers: AIProviderInfo[] }> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/providers`);
    if (!res.ok) throw new Error('Failed to fetch AI providers');
    const data = await res.json();
    return {
      defaultProvider: data.defaultProvider,
      providers: data.providers || [],
    };
  }

  static async listConversations(sessionId: string): Promise<Conversation[]> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations?sessionId=${encodeURIComponent(sessionId)}`, {
      headers: { 'x-session-id': sessionId },
    });
    if (!res.ok) throw new Error('Failed to load conversations');
    const data = await res.json();
    return data.conversations || [];
  }

  static async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation');
    const data = await res.json();
    return {
      conversation: data.conversation,
      messages: data.messages || [],
    };
  }

  static async createConversation(params: {
    sessionId: string;
    title?: string;
    mode?: 'general' | 'context';
    provider?: string;
    initialContext?: {
      title: string;
      url: string;
      selectedText: string;
      sourceType?: string;
    };
  }): Promise<Conversation> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create conversation');
    }
    const data = await res.json();
    return data.conversation;
  }

  static async deleteConversation(id: string): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete conversation');
  }

  static async addContextSource(conversationId: string, context: {
    title: string;
    url: string;
    selectedText: string;
    sourceType?: string;
  }): Promise<Conversation> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations/${conversationId}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });
    if (!res.ok) throw new Error('Failed to add context source');
    const data = await res.json();
    return data.conversation;
  }

  static async removeContextSource(conversationId: string, contextId: string): Promise<Conversation> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations/${conversationId}/context/${contextId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove context source');
    const data = await res.json();
    return data.conversation;
  }

  static async updateConversation(conversationId: string, updates: { title?: string; mode?: 'general' | 'context' }): Promise<Conversation> {
    const baseUrl = await this.getBaseUrl();
    const res = await fetch(`${baseUrl}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    const data = await res.json();
    return data.conversation;
  }

  /**
   * Stream chat with Server-Sent Events (SSE)
   */
  static async streamChat(params: {
    conversationId: string;
    content: string;
    provider?: string;
    model?: string;
    signal?: AbortSignal;
    onStart?: (meta: any) => void;
    onToken: (chunk: string) => void;
    onDone: (data: { messageId?: string; fullContent: string; provider?: string; model?: string }) => void;
    onError: (err: string) => void;
  }): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: params.conversationId,
        content: params.content,
        provider: params.provider,
        model: params.model,
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Streaming request failed' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No readable stream available in response');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.replace('event:', '').trim();
          continue;
        }

        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.replace('data:', '').trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === 'start' && params.onStart) {
              params.onStart(parsed);
            } else if (currentEvent === 'token') {
              params.onToken(parsed.chunk);
            } else if (currentEvent === 'done') {
              params.onDone(parsed);
            } else if (currentEvent === 'error') {
              params.onError(parsed.error);
            }
          } catch {
            // raw string data
            if (currentEvent === 'token') {
              params.onToken(dataStr);
            }
          }
        }
      }
    }
  }
}
