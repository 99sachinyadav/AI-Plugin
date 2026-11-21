import React from 'react';
import { Sparkles, Plus, History, Monitor } from 'lucide-react';
import { ProviderSelector } from './ProviderSelector';
import { AIProviderInfo } from '../../types';

interface HeaderProps {
  isBackendConnected: boolean;
  providers: AIProviderInfo[];
  activeProviderId: string;
  onSelectProvider: (id: string) => void;
  onNewChat: () => void;
  onToggleHistory: () => void;
  onToggleDevTools: () => void;
  isDevToolsOpen: boolean;
  conversationCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendConnected,
  providers,
  activeProviderId,
  onSelectProvider,
  onNewChat,
  onToggleHistory,
  onToggleDevTools,
  isDevToolsOpen,
  conversationCount,
}) => {
  return (
    <header className="sticky top-0 z-20 flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2.5 transition-colors">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm shadow-brand-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Contextly
              </span>
              <span className="rounded bg-brand-50 px-1.5 py-0.2 text-[10px] font-medium text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Connection status dot */}
          <div
            title={isBackendConnected ? 'Backend Connected' : 'Backend Disconnected (Run backend server on port 5000)'}
            className="flex items-center gap-1 px-1.5 py-1 text-[11px] text-slate-500 dark:text-slate-400"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="hidden xs:inline text-[10px]">
              {isBackendConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* DevTools Toggle Button */}
          <button
            onClick={onToggleDevTools}
            title="Toggle DevTools Panel (Network & Console)"
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isDevToolsOpen
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>

          {/* History Button */}
          <button
            onClick={onToggleHistory}
            title="Conversation History"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <History className="h-4 w-4" />
            {conversationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-200 px-1 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {conversationCount}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            title="New Chat"
            className="flex items-center gap-1 h-8 rounded-lg bg-slate-900 px-2.5 text-xs font-medium text-white shadow hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">New Chat</span>
          </button>
        </div>
      </div>

      {/* Provider Selector row */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-1.5">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
          AI Engine:
        </span>
        <ProviderSelector
          providers={providers}
          activeProviderId={activeProviderId}
          onSelectProvider={onSelectProvider}
        />
      </div>
    </header>
  );
};
