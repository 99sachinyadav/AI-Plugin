import { AIProvider } from './AIProvider.interface';
import { GeminiProvider } from './GeminiProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { config } from '../config/env';

export class AIProviderFactory {
  private static providers: Map<string, AIProvider> = new Map();

  static initialize(): void {
    if (this.providers.size === 0) {
      const gemini = new GeminiProvider();
      const deepseek = new DeepSeekProvider();
      const openai = new OpenAIProvider();

      this.providers.set(gemini.id, gemini);
      this.providers.set(deepseek.id, deepseek);
      this.providers.set(openai.id, openai);
    }
  }

  /**
   * Retrieves an AI provider by id or falls back to backend default (config.AI_PROVIDER).
   * Validates that the provider exists and is supported.
   */
  static getProvider(providerId?: string): AIProvider {
    this.initialize();

    const targetId = (providerId || config.AI_PROVIDER || 'gemini').toLowerCase();
    const provider = this.providers.get(targetId);

    if (!provider) {
      const available = Array.from(this.providers.keys()).join(', ');
      throw new Error(`Unsupported AI provider: "${targetId}". Available providers: ${available}`);
    }

    return provider;
  }

  /**
   * Returns metadata about all registered providers and their configuration status
   */
  static getRegisteredProvidersInfo(): Array<{
    id: string;
    name: string;
    defaultModel: string;
    supportedModels: string[];
    isConfigured: boolean;
    isDefault: boolean;
  }> {
    this.initialize();

    const defaultId = (config.AI_PROVIDER || 'gemini').toLowerCase();

    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      defaultModel: p.defaultModel,
      supportedModels: p.supportedModels,
      isConfigured: p.isConfigured(),
      isDefault: p.id === defaultId,
    }));
  }

  /**
   * Allow injecting custom/mock provider (useful for testing)
   */
  static registerProvider(provider: AIProvider): void {
    this.initialize();
    this.providers.set(provider.id, provider);
  }
}
