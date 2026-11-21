import React from 'react';
import { Cpu } from 'lucide-react';
import { AIProviderInfo } from '../../types';

interface ProviderSelectorProps {
  providers: AIProviderInfo[];
  activeProviderId: string;
  onSelectProvider: (id: string) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  activeProviderId,
  onSelectProvider,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <select
          value={activeProviderId}
          onChange={(e) => onSelectProvider(e.target.value)}
          className="appearance-none rounded-md border border-slate-200 bg-white py-0.5 pl-2 pr-6 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {providers.length > 0 ? (
            providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.defaultModel})
              </option>
            ))
          ) : (
            <>
              <option value="gemini">Google Gemini (Default)</option>
              <option value="deepseek">DeepSeek AI</option>
              <option value="openai">OpenAI</option>
            </>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
