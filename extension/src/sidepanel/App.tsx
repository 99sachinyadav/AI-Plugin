import React, { useState } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { ContextCard } from './components/ContextCard';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ConversationDrawer } from './components/ConversationDrawer';
import { DevToolsPanel } from './components/DevToolsPanel';
import { useChat } from './hooks/useChat';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  const {
    conversations,
    activeConversation,
    messages,
    mode,
    providers,
    activeProviderId,
    isBackendConnected,
    isLoading,
    isStreaming,
    error,
    startNewChat,
    switchMode,
    switchProvider,
    loadConversation,
    deleteConversation,
    removeContextSource,
    addDevToolsAsContext,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  } = useChat();

  const contextSources = activeConversation?.contextSources || [];

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand-500/20">
      {/* Header with Engine Selector and Controls */}
      <Header
        isBackendConnected={isBackendConnected}
        providers={providers}
        activeProviderId={activeProviderId}
        onSelectProvider={switchProvider}
        onNewChat={() => startNewChat()}
        onToggleHistory={() => setIsHistoryOpen(true)}
        onToggleDevTools={() => setIsDevToolsOpen(v => !v)}
        isDevToolsOpen={isDevToolsOpen}
        conversationCount={conversations.length}
      />

      {/* Mode Switcher Tabs */}
      <ModeSelector
        mode={mode}
        contextSourcesCount={contextSources.length}
        onModeChange={switchMode}
        disabled={isStreaming}
      />

      {/* Structured Context Sources Card (displayed when in Contextual Mode) */}
      {mode === 'context' && (
        <ContextCard
          sources={contextSources}
          onRemoveSource={removeContextSource}
        />
      )}

      {/* DevTools Panel — Network & Console capture */}
      {isDevToolsOpen && (
        <DevToolsPanel
          onAddAsContext={addDevToolsAsContext}
          onSwitchToContextMode={() => switchMode('context')}
        />
      )}

      {/* Conversation Messages */}
      <MessageList
        messages={messages}
        mode={mode}
        isLoading={isLoading}
        isStreaming={isStreaming}
        error={error}
        onSelectPrompt={sendMessage}
        onRegenerate={regenerateResponse}
      />

      {/* Multiline Chat Input */}
      <ChatInput
        onSendMessage={sendMessage}
        onStopGeneration={stopGeneration}
        isStreaming={isStreaming}
      />

      {/* Conversation History Drawer */}
      <ConversationDrawer
        isOpen={isHistoryOpen}
        conversations={conversations}
        activeConversationId={activeConversation?._id || activeConversation?.id || null}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onNewChat={() => startNewChat()}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
