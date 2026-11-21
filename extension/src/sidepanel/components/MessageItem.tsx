import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, User, Bot } from 'lucide-react';
import { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`flex w-full gap-2.5 px-3 py-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xs">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`group relative max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs transition-colors ${
          isUser
            ? 'bg-brand-600 text-white selection:bg-brand-800 selection:text-white'
            : 'bg-white border border-slate-200 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
        }`}
      >
        {/* Message Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-xs dark:prose-invert max-w-none leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const [codeCopied, setCodeCopied] = useState(false);

                  if (!inline && match) {
                    const codeString = String(children).replace(/\n$/, '');
                    const handleCopyCode = async () => {
                      await navigator.clipboard.writeText(codeString);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    };

                    return (
                      <div className="relative my-2 rounded-lg bg-slate-950 font-mono text-[11px] shadow-md overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-400">
                          <span>{match[1]}</span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-800 hover:text-white"
                          >
                            {codeCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{codeCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="p-2.5 overflow-x-auto">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Streaming indicator cursor */}
            {message.isStreaming && (
              <span className="inline-block h-3.5 w-1.5 animate-pulse bg-brand-500 align-middle ml-1" />
            )}
          </div>
        )}

        {/* Action bar for Assistant messages */}
        {!isUser && !message.isStreaming && (
          <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800/80">
            {message.provider && (
              <span className="mr-auto font-mono text-[9px] text-slate-400 uppercase">
                {message.provider}
              </span>
            )}

            <button
              type="button"
              onClick={handleCopyMessage}
              title="Copy message"
              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {isLastAssistant && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Regenerate response"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
};
