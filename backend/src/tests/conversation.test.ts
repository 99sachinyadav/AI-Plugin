import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationService } from '../services/conversation.service';

describe('Conversation & Context Source Service', () => {
  const sessionId = 'test-session-123';

  beforeEach(() => {
    ConversationService.clearMemory();
  });

  it('should create a general conversation', async () => {
    const conv = await ConversationService.create({
      sessionId,
      title: 'General Inquiries',
      mode: 'general',
    });

    expect(conv).toBeDefined();
    expect(conv.sessionId).toBe(sessionId);
    expect(conv.mode).toBe('general');
    expect(conv.contextSources).toHaveLength(0);
  });

  it('should create a contextual conversation with initial context', async () => {
    const conv = await ConversationService.create({
      sessionId,
      initialContext: {
        title: 'MDN Web Docs: Fetch API',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
        selectedText: 'The Fetch API provides an interface for fetching resources.',
      },
    });

    expect(conv).toBeDefined();
    expect(conv.mode).toBe('context');
    expect(conv.contextSources).toHaveLength(1);
    expect(conv.contextSources[0].title).toBe('MDN Web Docs: Fetch API');
    expect(conv.contextSources[0].selectedText).toContain('interface for fetching resources');
  });

  it('should append additional context sources to an existing conversation', async () => {
    const conv = await ConversationService.create({
      sessionId,
      title: 'Multi-context conversation',
      mode: 'context',
    });

    const convId = conv._id ? conv._id.toString() : conv.id;

    await ConversationService.addContextSource(convId, {
      title: 'Source 1',
      url: 'https://site1.com',
      selectedText: 'Snippet 1',
    });

    const updated = await ConversationService.addContextSource(convId, {
      title: 'Source 2',
      url: 'https://site2.com',
      selectedText: 'Snippet 2',
    });

    expect(updated.contextSources).toHaveLength(2);
    expect(updated.contextSources[0].title).toBe('Source 1');
    expect(updated.contextSources[1].title).toBe('Source 2');
  });

  it('should remove an individual context source', async () => {
    const conv = await ConversationService.create({
      sessionId,
      initialContext: {
        title: 'Initial Source',
        url: 'https://init.com',
        selectedText: 'To be removed',
      },
    });

    const convId = conv._id ? conv._id.toString() : conv.id;
    const contextId = conv.contextSources[0]._id ? conv.contextSources[0]._id.toString() : conv.contextSources[0].id;

    const updated = await ConversationService.removeContextSource(convId, contextId);
    expect(updated.contextSources).toHaveLength(0);
  });

  it('should save and retrieve ordered message history', async () => {
    const conv = await ConversationService.create({ sessionId, title: 'Chat' });
    const convId = conv._id ? conv._id.toString() : conv.id;

    await ConversationService.saveMessage({
      conversationId: convId,
      role: 'user',
      content: 'What is TypeScript?',
    });

    await ConversationService.saveMessage({
      conversationId: convId,
      role: 'assistant',
      content: 'TypeScript is a typed superset of JavaScript.',
    });

    const messages = await ConversationService.getMessages(convId);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('What is TypeScript?');
    expect(messages[1].role).toBe('assistant');
  });

  it('should delete a conversation and its messages', async () => {
    const conv = await ConversationService.create({ sessionId, title: 'To Delete' });
    const convId = conv._id ? conv._id.toString() : conv.id;

    await ConversationService.saveMessage({
      conversationId: convId,
      role: 'user',
      content: 'Hello',
    });

    const deleted = await ConversationService.deleteById(convId);
    expect(deleted).toBe(true);

    const fetched = await ConversationService.getById(convId);
    expect(fetched).toBeNull();

    const messages = await ConversationService.getMessages(convId);
    expect(messages).toHaveLength(0);
  });
});
