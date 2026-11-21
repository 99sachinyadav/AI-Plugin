import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, GenerateParams, GenerateResult, StreamChunk } from './AIProvider.interface';
import { config } from '../config/env';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly defaultModel = config.GEMINI_MODEL || 'gemini-2.5-flash';
  readonly supportedModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY) {
      this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
  }

  isConfigured(): boolean {
    return Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim().length > 0);
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in backend/.env');
      }
      this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
    return this.client;
  }

  private buildContents(params: GenerateParams) {
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of params.messages) {
      if (msg.role === 'system') continue;
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    return contents;
  }

  /**
   * Helper to execute a call with automatic model fallback if 404 occurs
   */
  private getFallbackCandidateModels(preferredModel: string): string[] {
    const candidates = [
      preferredModel,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-pro',
    ];
    return Array.from(new Set(candidates));
  }

  async generateText(params: GenerateParams): Promise<GenerateResult> {
    const client = this.getClient();
    const primaryModel = params.model || this.defaultModel;
    const candidates = this.getFallbackCandidateModels(primaryModel);
    const contents = this.buildContents(params);

    let lastError: any = null;

    for (const modelName of candidates) {
      try {
        const generativeModel = client.getGenerativeModel({
          model: modelName,
          systemInstruction: params.systemPrompt ? { role: 'system', parts: [{ text: params.systemPrompt }] } : undefined,
        });

        const response = await generativeModel.generateContent({
          contents,
          generationConfig: {
            temperature: params.temperature ?? 0.3,
            maxOutputTokens: params.maxTokens ?? 2048,
          },
        });

        const text = response.response.text();
        return {
          text,
          provider: this.id,
          model: modelName,
          usage: response.response.usageMetadata ? {
            promptTokens: response.response.usageMetadata.promptTokenCount,
            completionTokens: response.response.usageMetadata.candidatesTokenCount,
            totalTokens: response.response.usageMetadata.totalTokenCount,
          } : undefined,
        };
      } catch (err: any) {
        lastError = err;
        if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
          // Model not found in this API project; attempt next candidate
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Gemini Provider generation error: ${lastError?.message || lastError}`);
  }

  async *generateStream(params: GenerateParams): AsyncIterable<StreamChunk> {
    const client = this.getClient();
    const primaryModel = params.model || this.defaultModel;
    const candidates = this.getFallbackCandidateModels(primaryModel);
    const contents = this.buildContents(params);

    let lastError: any = null;

    for (const modelName of candidates) {
      try {
        const generativeModel = client.getGenerativeModel({
          model: modelName,
          systemInstruction: params.systemPrompt ? { role: 'system', parts: [{ text: params.systemPrompt }] } : undefined,
        });

        const responseStream = await generativeModel.generateContentStream({
          contents,
          generationConfig: {
            temperature: params.temperature ?? 0.3,
            maxOutputTokens: params.maxTokens ?? 2048,
          },
        });

        for await (const chunk of responseStream.stream) {
          const text = chunk.text();
          if (text) {
            yield {
              text,
              done: false,
              provider: this.id,
              model: modelName,
            };
          }
        }

        yield {
          text: '',
          done: true,
          provider: this.id,
          model: modelName,
        };

        return; // Success, exit generator
      } catch (err: any) {
        lastError = err;
        if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
          // Model not found in this API project; try next candidate
          continue;
        }
        throw new Error(`Gemini Provider streaming error: ${err.message || err}`);
      }
    }

    throw new Error(`Gemini Provider streaming error: ${lastError?.message || lastError}`);
  }
}
