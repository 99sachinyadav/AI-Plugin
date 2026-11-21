import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { AIProviderFactory } from '../providers/AIProviderFactory';
import { AIProvider, GenerateParams, GenerateResult, StreamChunk } from '../providers/AIProvider.interface';
import { ConversationService } from '../services/conversation.service';

class TestMockProvider implements AIProvider {
  readonly id = 'test-mock';
  readonly name = 'Test Mock Provider';
  readonly defaultModel = 'mock-v1';
  readonly supportedModels = ['mock-v1'];

  isConfigured(): boolean {
    return true;
  }

  async generateText(params: GenerateParams): Promise<GenerateResult> {
    return {
      text: `Generated response for: ${params.messages[params.messages.length - 1].content}`,
      provider: this.id,
      model: this.defaultModel,
    };
  }

  async *generateStream(params: GenerateParams): AsyncIterable<StreamChunk> {
    yield { text: 'Chunk 1. ', done: false, provider: this.id };
    yield { text: 'Chunk 2.', done: false, provider: this.id };
    yield { text: '', done: true, provider: this.id };
  }
}

describe('API Integration Endpoints', () => {
  const app = createApp();
  const sessionId = 'api-test-session';

  beforeEach(() => {
    ConversationService.clearMemory();
    AIProviderFactory.initialize();
    AIProviderFactory.registerProvider(new TestMockProvider());
  });

  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/providers should return provider list and default', async () => {
    const res = await request(app).get('/api/providers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.providers)).toBe(true);
  });

  it('POST /api/conversations should create new conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .send({
        sessionId,
        title: 'Testing API Conversation',
        mode: 'general',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.conversation.title).toBe('Testing API Conversation');
  });

  it('POST /api/chat should generate response via provider', async () => {
    const convRes = await request(app)
      .post('/api/conversations')
      .send({
        sessionId,
        mode: 'general',
      });

    const convId = convRes.body.conversation._id || convRes.body.conversation.id;

    const chatRes = await request(app)
      .post('/api/chat')
      .send({
        conversationId: convId,
        content: 'Explain recursion',
        provider: 'test-mock',
      });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);
    expect(chatRes.body.message.content).toContain('Generated response for: Explain recursion');
  });

  it('POST /api/chat/stream should stream SSE tokens', async () => {
    const convRes = await request(app)
      .post('/api/conversations')
      .send({
        sessionId,
        mode: 'general',
      });

    const convId = convRes.body.conversation._id || convRes.body.conversation.id;

    const streamRes = await request(app)
      .post('/api/chat/stream')
      .send({
        conversationId: convId,
        content: 'Stream this message',
        provider: 'test-mock',
      });

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers['content-type']).toContain('text/event-stream');
    expect(streamRes.text).toContain('event: start');
    expect(streamRes.text).toContain('event: token');
    expect(streamRes.text).toContain('Chunk 1.');
    expect(streamRes.text).toContain('event: done');
  });
});
