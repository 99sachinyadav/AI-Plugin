import React, { useState } from 'react';
import { FileText, ExternalLink, X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { ContextSource } from '../../types';

interface ContextCardProps {
  sources: ContextSource[];
  onRemoveSource: (contextId: string) => void;
}

export const ContextCard: React.FC<ContextCardProps> = ({
  sources,
  onRemoveSource,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!sources || sources.length === 0) {
    return (
      <div className="mx-3 mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5 text-center text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-300">
        <p className="font-medium">No webpage context active</p>
        <p className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-400/80">
          Select text on any webpage, right-click, and choose <strong>"Ask Contextly"</strong> to start a grounded conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-2 flex flex-col gap-1.5">
      {/* Grounding guarantee indicator */}
      <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>Grounded in {sources.length} webpage source{sources.length > 1 ? 's' : ''}</span>
      </div>

      {/* List of context sources */}
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
        {sources.map((src, idx) => {
          const id = src._id || src.id || String(idx);
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={id}
              className="group relative rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {src.title || 'Webpage snippet'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open source URL"
                      className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveSource(id)}
                    title="Remove context source"
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Snippet text */}
              <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                <p className={`${isExpanded ? '' : 'line-clamp-2'} italic border-l-2 border-brand-400 pl-1.5`}>
                  "{src.selectedText}"
                </p>
                {src.selectedText.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp className="h-2.5 w-2.5" />
                      </>
                    ) : (
                      <>
                        <span>Show full text</span>
                        <ChevronDown className="h-2.5 w-2.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
