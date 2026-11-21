import OpenAI from 'openai';
import { AIProvider, GenerateParams, GenerateResult, StreamChunk } from './AIProvider.interface';
import { config } from '../config/env';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly defaultModel = config.OPENAI_MODEL || 'gpt-4o-mini';
  readonly supportedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

  private client: OpenAI | null = null;

  constructor() {
    if (config.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(config.OPENAI_API_KEY && config.OPENAI_API_KEY.trim().length > 0);
  }

  private getClient(): OpenAI {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in backend/.env');
      }
      this.client = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
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
      throw new Error(`OpenAI Provider streaming error: ${error.message || error}`);
    }
  }
}
