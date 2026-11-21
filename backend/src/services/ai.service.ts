import { AIProviderFactory } from '../providers/AIProviderFactory';
import { GenerateParams, GenerateResult, StreamChunk, StructuredContextSource } from '../providers/AIProvider.interface';
import { config } from '../config/env';

export class AIService {
  /**
   * Constructs strict grounding system prompt for Contextual Chat or clean prompt for General Chat.
   */
  static buildSystemPrompt(mode: 'general' | 'context', contextSources?: StructuredContextSource[]): string {
    if (mode === 'context' && contextSources && contextSources.length > 0) {
      let sourcesText = '';
      contextSources.forEach((src, idx) => {
        const textLimit = Math.floor(config.MAX_CONTEXT_CHAR_LIMIT / Math.max(contextSources.length, 1));
        const snippet = src.selectedText.length > textLimit
          ? src.selectedText.substring(0, textLimit) + '... [truncated]'
          : src.selectedText;

        sourcesText += `\n--- [SOURCE ${idx + 1}] ---\nTitle: ${src.title || 'Untitled Webpage'}\nURL: ${src.url || 'N/A'}\nSelected Text:\n"""\n${snippet}\n"""\n`;
      });

      return `You are Contextly, an intelligent AI browser companion operating in CONTEXTUAL CHAT MODE.

THE USER HAS SELECTED AND PROVIDED THE FOLLOWING WEBPAGE TEXT CONTENT AS GROUNDING CONTEXT:
${sourcesText}

CRITICAL OPERATIONAL RULES:
1. ACCURACY & GROUNDING: Your primary goal is to answer based directly and accurately on the selected context sources above. Cite the source title or URL when quoting or referring to facts.
2. STRICT ANTI-HALLUCINATION: NEVER fabricate information or claim a statement, fact, or conclusion came from the selected source unless it is explicitly and faithfully supported by the provided text.
3. INSUFFICIENT OR OUT-OF-CONTEXT QUESTIONS: If the user's question cannot be answered using the provided context sources, or if the context lacks necessary information:
   - CLEARLY AND EXPLICITLY state that the provided context does not contain this information.
   - State that you are answering using general AI knowledge before providing the general answer.
4. FORMATTING: Format your responses cleanly with Markdown, including bullet points, bold key terms, and code blocks with language identifiers where appropriate.`;
    }

    // General Chat mode prompt
    return `You are Contextly, a fast, knowledgeable, and helpful AI browser companion operating in GENERAL CHAT MODE.

OPERATIONAL RULES:
1. Provide direct, concise, and insightful answers to any user query.
2. Format your response cleanly using Markdown (use bold text, bullet points, headers, and syntax-highlighted code blocks where helpful).
3. Do not pretend to reference webpage context because no webpage selection is active in this conversation.`;
  }

  /**
   * Generate complete response
   */
  static async generate(params: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    mode: 'general' | 'context';
    contextSources?: StructuredContextSource[];
    providerId?: string;
    model?: string;
  }): Promise<GenerateResult> {
    const provider = AIProviderFactory.getProvider(params.providerId);
    const systemPrompt = this.buildSystemPrompt(params.mode, params.contextSources);

    const generateParams: GenerateParams = {
      systemPrompt,
      messages: params.messages,
      contextSources: params.contextSources,
      mode: params.mode,
      model: params.model,
    };

    return await provider.generateText(generateParams);
  }

  /**
   * Stream response tokens via async iterator
   */
  static async *stream(params: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    mode: 'general' | 'context';
    contextSources?: StructuredContextSource[];
    providerId?: string;
    model?: string;
  }): AsyncIterable<StreamChunk> {
    const provider = AIProviderFactory.getProvider(params.providerId);
    const systemPrompt = this.buildSystemPrompt(params.mode, params.contextSources);

    const generateParams: GenerateParams = {
      systemPrompt,
      messages: params.messages,
      contextSources: params.contextSources,
      mode: params.mode,
      model: params.model,
    };

    yield* provider.generateStream(generateParams);
  }
}
