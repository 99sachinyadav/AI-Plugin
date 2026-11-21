import React from 'react';
import { MessageSquare, Layers } from 'lucide-react';
import { ChatMode } from '../../types';

interface ModeSelectorProps {
  mode: ChatMode;
  contextSourcesCount: number;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  contextSourcesCount,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className="px-3 pt-2">
      <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/80">
        {/* General Chat Tab */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange('general')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
            mode === 'general'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>General Chat</span>
        </button>

        {/* Contextual Chat Tab */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange('context')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
            mode === 'context'
              ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Contextual</span>
          {contextSourcesCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-100 px-1 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {contextSourcesCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
