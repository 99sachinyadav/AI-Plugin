import React, { useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { Message, ChatMode } from '../../types';

interface MessageListProps {
  messages: Message[];
  mode: ChatMode;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  mode,
  isLoading,
  isStreaming,
  error,
  onSelectPrompt,
  onRegenerate,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or tokens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, isLoading]);

  const generalPrompts = [
    'Explain the concept of Web Workers',
    'Write a TypeScript function to debounce API calls',
    'What are the key trade-offs of microservices?',
  ];

  const contextPrompts = [
    'Summarize this selected text into 3 key takeaways',
    'Explain any complex terminology in this snippet',
    'What action items or conclusions are suggested here?',
  ];

  const suggestedPrompts = mode === 'context' ? contextPrompts : generalPrompts;

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20 mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {mode === 'context' ? 'Contextual Chat Ready' : 'How can I assist you?'}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {mode === 'context'
            ? 'Ask questions directly grounded in your selected webpage snippets.'
            : 'Ask general coding, research, writing, or analysis questions anytime.'}
        </p>

        {/* Starter Prompts */}
        <div className="mt-4 flex flex-col gap-1.5 w-full max-w-xs">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(p)}
              className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-left text-xs text-slate-700 hover:border-brand-500 hover:bg-white hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:bg-slate-900 transition-all shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {messages.map((msg, idx) => {
        const isLastAssistant =
          !isStreaming &&
          idx === messages.length - 1 &&
          msg.role === 'assistant';

        return (
          <MessageItem
            key={msg._id || msg.id || idx}
            message={msg}
            isLastAssistant={isLastAssistant}
            onRegenerate={onRegenerate}
          />
        );
      })}

      {/* Loading state indicator before first token */}
      {isLoading && !isStreaming && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-600" />
          <span>Contextly is thinking...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mx-3 my-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
