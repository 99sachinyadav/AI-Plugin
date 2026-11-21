import { describe, it, expect, beforeEach } from 'vitest';
import { AIProviderFactory } from '../providers/AIProviderFactory';
import { AIProvider, GenerateParams, GenerateResult, StreamChunk } from '../providers/AIProvider.interface';

class MockProvider implements AIProvider {
  readonly id = 'mock-provider';
  readonly name = 'Mock Provider';
  readonly defaultModel = 'mock-model-v1';
  readonly supportedModels = ['mock-model-v1', 'mock-model-v2'];

  isConfigured(): boolean {
    return true;
  }

  async generateText(params: GenerateParams): Promise<GenerateResult> {
    return {
      text: `Mock answer for mode: ${params.mode}`,
      provider: this.id,
      model: this.defaultModel,
    };
  }

  async *generateStream(params: GenerateParams): AsyncIterable<StreamChunk> {
    yield { text: 'Mock ', done: false, provider: this.id };
    yield { text: 'streaming ', done: false, provider: this.id };
    yield { text: 'response', done: false, provider: this.id };
    yield { text: '', done: true, provider: this.id };
  }
}

describe('AI Provider Architecture & Factory', () => {
  beforeEach(() => {
    AIProviderFactory.initialize();
  });

  it('should initialize with default providers: gemini, deepseek, openai', () => {
    const gemini = AIProviderFactory.getProvider('gemini');
    expect(gemini).toBeDefined();
    expect(gemini.id).toBe('gemini');

    const deepseek = AIProviderFactory.getProvider('deepseek');
    expect(deepseek).toBeDefined();
    expect(deepseek.id).toBe('deepseek');

    const openai = AIProviderFactory.getProvider('openai');
    expect(openai).toBeDefined();
    expect(openai.id).toBe('openai');
  });

  it('should return default provider when no provider ID is specified', () => {
    const provider = AIProviderFactory.getProvider();
    expect(provider).toBeDefined();
    expect(['gemini', 'deepseek', 'openai']).toContain(provider.id);
  });

  it('should throw clear error when an unsupported provider is requested', () => {
    expect(() => {
      AIProviderFactory.getProvider('unsupported-provider-xyz');
    }).toThrow(/Unsupported AI provider/);
  });

  it('should allow registering and using custom or mock providers', async () => {
    const mock = new MockProvider();
    AIProviderFactory.registerProvider(mock);

    const retrieved = AIProviderFactory.getProvider('mock-provider');
    expect(retrieved.id).toBe('mock-provider');
    expect(retrieved.name).toBe('Mock Provider');

    const res = await retrieved.generateText({
      messages: [{ role: 'user', content: 'Hello' }],
      mode: 'general',
    });
    expect(res.text).toBe('Mock answer for mode: general');
  });

  it('should report registered provider info and configuration status', () => {
    const list = AIProviderFactory.getRegisteredProvidersInfo();
    expect(list.length).toBeGreaterThanOrEqual(3);

    const ids = list.map(p => p.id);
    expect(ids).toContain('gemini');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('openai');

    const defaultItems = list.filter(p => p.isDefault);
    expect(defaultItems.length).toBe(1);
  });
});
