import OpenAI from 'openai';
import { AIProvider, GenerateParams, GenerateResult, StreamChunk } from './AIProvider.interface';
import { config } from '../config/env';

export class DeepSeekProvider implements AIProvider {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek AI';
  readonly defaultModel = config.DEEPSEEK_MODEL || 'deepseek-chat';
  readonly supportedModels = ['deepseek-chat', 'deepseek-reasoner'];

  private client: OpenAI | null = null;

  constructor() {
    if (config.DEEPSEEK_API_KEY) {
      this.client = new OpenAI({
        apiKey: config.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(config.DEEPSEEK_API_KEY && config.DEEPSEEK_API_KEY.trim().length > 0);
  }

  private getClient(): OpenAI {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw new Error('DeepSeek API key is not configured. Set DEEPSEEK_API_KEY in backend/.env');
      }
      this.client = new OpenAI({
        apiKey: config.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
    }
    return this.client;
  }

  private buildMessages(params: GenerateParams): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    for (const msg of params.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  async generateText(params: GenerateParams): Promise<GenerateResult> {
    const client = this.getClient();
    const modelName = params.model || this.defaultModel;
    const messages = this.buildMessages(params);

    const completion = await client.chat.completions.create({
      model: modelName,
      messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 2048,
    });

    const choice = completion.choices[0];
    const text = choice?.message?.content || '';

    return {
      text,
      provider: this.id,
      model: modelName,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  }

  async *generateStream(params: GenerateParams): AsyncIterable<StreamChunk> {
    const client = this.getClient();
    const modelName = params.model || this.defaultModel;
    const messages = this.buildMessages(params);

    try {
      const stream = await client.chat.completions.create({
        model: modelName,
        messages,
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
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
    } catch (error: any) {
      throw new Error(`DeepSeek Provider streaming error: ${error.message || error}`);
    }
  }
}
