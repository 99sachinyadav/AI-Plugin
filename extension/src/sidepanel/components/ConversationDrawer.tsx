import React from 'react';
import { X, Trash2, MessageSquare, Layers, Plus } from 'lucide-react';
import { Conversation } from '../../types';

interface ConversationDrawerProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

export const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isOpen,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative flex w-4/5 max-w-xs flex-col bg-white shadow-2xl dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              History
            </span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {conversations.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick New Chat in drawer */}
        <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Start New Chat</span>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations yet.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((c) => {
                const id = c._id || c.id || '';
                const isActive = id === activeConversationId;
                const isContext = c.mode === 'context';

                return (
                  <div
                    key={id}
                    onClick={() => {
                      onSelectConversation(id);
                      onClose();
                    }}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-950/60 dark:text-brand-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isContext ? (
                        <Layers className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <span className="truncate">{c.title || 'Untitled'}</span>
                    </div>

                    <button
                      type="button"
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
