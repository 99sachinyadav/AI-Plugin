import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea up to 140px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSendMessage(trimmed);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white/95 p-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="relative flex items-end rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs focus-within:border-brand-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-500 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:border-brand-500 dark:focus-within:bg-slate-800">
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Contextly (Enter to send, Shift+Enter for newline)..."
          disabled={disabled}
          className="max-h-36 min-h-[38px] flex-1 resize-none bg-transparent px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500"
        />

        <div className="flex items-center p-1.5 shrink-0">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              title="Stop generating"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs hover:bg-rose-600 transition-colors"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || disabled}
              title="Send message"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
