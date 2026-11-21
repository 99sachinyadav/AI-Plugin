export interface StreamChunk {
  text: string;
  done: boolean;
  provider?: string;
  model?: string;
  error?: string;
}

export interface StructuredContextSource {
  id?: string;
  title: string;
  url: string;
  selectedText: string;
  sourceType?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateParams {
  systemPrompt?: string;
  messages: ChatMessage[];
  contextSources?: StructuredContextSource[];
  mode: 'general' | 'context';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultModel: string;
  readonly supportedModels: string[];

  isConfigured(): boolean;
  generateText(params: GenerateParams): Promise<GenerateResult>;
  generateStream(params: GenerateParams): AsyncIterable<StreamChunk>;
}
