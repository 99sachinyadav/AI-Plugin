import { describe, it, expect } from 'vitest';
import { AIService } from '../services/ai.service';
import { StructuredContextSource } from '../providers/AIProvider.interface';

describe('Context Management & Prompt Grounding', () => {
  it('should build general mode system prompt when mode is general', () => {
    const prompt = AIService.buildSystemPrompt('general');
    expect(prompt).toContain('GENERAL CHAT MODE');
    expect(prompt).toContain('Contextly');
    expect(prompt).not.toContain('CRITICAL GROUNDING RULES');
  });

  it('should build grounded contextual prompt when context sources are present', () => {
    const sources: StructuredContextSource[] = [
      {
        title: 'React Documentation - Hooks',
        url: 'https://react.dev/reference/react/hooks',
        selectedText: 'Hooks let you use different React features from your components.',
      },
    ];

    const prompt = AIService.buildSystemPrompt('context', sources);

    expect(prompt).toContain('CONTEXTUAL CHAT MODE');
    expect(prompt).toContain('React Documentation - Hooks');
    expect(prompt).toContain('https://react.dev/reference/react/hooks');
    expect(prompt).toContain('Hooks let you use different React features from your components.');
    expect(prompt).toContain('NEVER fabricate information');
    expect(prompt).toContain('general AI knowledge');
  });

  it('should format multiple context sources properly', () => {
    const sources: StructuredContextSource[] = [
      {
        title: 'Page 1',
        url: 'https://example.com/1',
        selectedText: 'Content snippet from page 1.',
      },
      {
        title: 'Page 2',
        url: 'https://example.com/2',
        selectedText: 'Content snippet from page 2.',
      },
    ];

    const prompt = AIService.buildSystemPrompt('context', sources);
    expect(prompt).toContain('[SOURCE 1]');
    expect(prompt).toContain('[SOURCE 2]');
    expect(prompt).toContain('Content snippet from page 1.');
    expect(prompt).toContain('Content snippet from page 2.');
  });
});
