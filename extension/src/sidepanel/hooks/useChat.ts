import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';
import { Conversation, Message, ChatMode, AIProviderInfo, PendingContext } from '../../types';

export function useChat() {
  const [sessionId, setSessionId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<ChatMode>('general');
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string>('gemini');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize Session, Providers & Active Conversation
  useEffect(() => {
    async function init() {
      const sid = await StorageService.getSessionId();
      setSessionId(sid);

      // Check health & providers
      try {
        const health = await ApiService.getHealth();
        if (health) {
          setIsBackendConnected(true);
          const provData = await ApiService.getProviders();
          setProviders(provData.providers);

          const preferred = await StorageService.getPreferredProvider();
          setActiveProviderId(preferred || provData.defaultProvider || 'gemini');
        } else {
          setIsBackendConnected(false);
        }
      } catch {
        setIsBackendConnected(false);
      }

      // Load conversations
      try {
        const convList = await ApiService.listConversations(sid);
        setConversations(convList);

        const savedConvId = await StorageService.getActiveConversationId();
        if (savedConvId) {
          const match = convList.find((c: Conversation) => (c._id || c.id) === savedConvId);
          if (match) {
            await loadConversation(savedConvId);
          }
        }
      } catch (err: any) {
        console.warn('[Contextly] Conversation loading error:', err);
      }

      // Check for pending context from context menu
      await checkAndProcessPendingContext();
    }

    init();
  }, []);

  // Listen for Chrome runtime context captured messages
  useEffect(() => {
    const handleRuntimeMessage = async (message: any) => {
      if (message.type === 'CONTEXT_CAPTURED' && message.payload) {
        await handleApplyPendingContext(message.payload);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
      return () => {
        chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      };
    }
  }, [sessionId, activeConversation]);

  const checkAndProcessPendingContext = async () => {
    const pending = await StorageService.getPendingContext();
    if (pending) {
      await handleApplyPendingContext(pending);
      await StorageService.clearPendingContext();
    }
  };

  const handleApplyPendingContext = async (ctx: PendingContext) => {
    try {
      const sid = sessionId || (await StorageService.getSessionId());

      // If already in a contextual conversation, append context
      if (activeConversation && activeConversation.mode === 'context') {
        const convId = activeConversation._id || activeConversation.id!;
        const updated = await ApiService.addContextSource(convId, {
          title: ctx.title,
          url: ctx.url,
          selectedText: ctx.selectedText,
          sourceType: ctx.sourceType,
        });
        setActiveConversation(updated);
        setMode('context');
      } else {
        // Create new contextual conversation
        const newConv = await ApiService.createConversation({
          sessionId: sid,
          mode: 'context',
          title: `Context: ${ctx.title.slice(0, 30)}`,
          provider: activeProviderId,
          initialContext: {
            title: ctx.title,
            url: ctx.url,
            selectedText: ctx.selectedText,
            sourceType: ctx.sourceType,
          },
        });

        setActiveConversation(newConv);
        setMode('context');
        setMessages([]);
        await StorageService.setActiveConversationId(newConv._id || newConv.id!);
        setConversations(prev => [newConv, ...prev.filter(c => (c._id || c.id) !== (newConv._id || newConv.id))]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize contextual chat');
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.getConversation(id);
      setActiveConversation(data.conversation);
      setMessages(data.messages);
      setMode(data.conversation.mode);
      if (data.conversation.provider) {
        setActiveProviderId(data.conversation.provider);
      }
      await StorageService.setActiveConversationId(id);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async (targetMode: ChatMode = mode) => {
    try {
      setError(null);
      const sid = sessionId || (await StorageService.getSessionId());
      const newConv = await ApiService.createConversation({
        sessionId: sid,
        mode: targetMode,
        title: targetMode === 'context' ? 'New Contextual Chat' : 'New General Chat',
        provider: activeProviderId,
      });

      setActiveConversation(newConv);
      setMessages([]);
      setMode(targetMode);
      await StorageService.setActiveConversationId(newConv._id || newConv.id!);
      setConversations(prev => [newConv, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    }
  };

  const switchMode = async (newMode: ChatMode) => {
    setMode(newMode);
    if (activeConversation) {
      try {
        const convId = activeConversation._id || activeConversation.id!;
        const updated = await ApiService.updateConversation(convId, { mode: newMode });
        setActiveConversation(updated);
      } catch (err: any) {
        console.warn('Mode update error:', err);
      }
    }
  };

  const switchProvider = async (providerId: string) => {
    setActiveProviderId(providerId);
    await StorageService.setPreferredProvider(providerId);
  };

  const removeContextSource = async (contextId: string) => {
    if (!activeConversation) return;
    try {
      const convId = activeConversation._id || activeConversation.id!;
      const updated = await ApiService.removeContextSource(convId, contextId);
      setActiveConversation(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to remove context source');
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await ApiService.deleteConversation(id);
      setConversations(prev => prev.filter(c => (c._id || c.id) !== id));
      if (activeConversation && (activeConversation._id === id || activeConversation.id === id)) {
        setActiveConversation(null);
        setMessages([]);
        await StorageService.setActiveConversationId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setError(null);

    let conv = activeConversation;
    const sid = sessionId || (await StorageService.getSessionId());

    // Auto-create conversation if none active
    if (!conv) {
      try {
        conv = await ApiService.createConversation({
          sessionId: sid,
          mode,
          title: text.length > 30 ? text.substring(0, 30) + '...' : text,
          provider: activeProviderId,
        });
        setActiveConversation(conv);
        setConversations(prev => [conv!, ...prev]);
        await StorageService.setActiveConversationId(conv._id || conv.id!);
      } catch (err: any) {
        setError(err.message || 'Failed to initiate conversation');
        return;
      }
    }

    const convId = conv._id || conv.id!;

    // Optimistically add user message
    const userMessage: Message = {
      conversationId: convId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Placeholder for assistant streaming response
    const assistantPlaceholder: Message = {
      conversationId: convId,
      role: 'assistant',
      content: '',
      provider: activeProviderId,
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
    setIsLoading(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = '';

    try {
      await ApiService.streamChat({
        conversationId: convId,
        content: text,
        provider: activeProviderId,
        signal: controller.signal,
        onToken: (chunk: string) => {
          accumulatedContent += chunk;
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === 'assistant') {
              copy[copy.length - 1] = {
                ...last,
                content: accumulatedContent,
                isStreaming: true,
              };
            }
            return copy;
          });
        },
        onDone: (data: { messageId?: string; fullContent: string; provider?: string; model?: string }) => {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === 'assistant') {
              copy[copy.length - 1] = {
                ...last,
                _id: data.messageId,
                content: data.fullContent || accumulatedContent,
                provider: data.provider || activeProviderId,
                model: data.model,
                isStreaming: false,
              };
            }
            return copy;
          });
          setIsStreaming(false);
          setIsLoading(false);
        },
        onError: (errText: string) => {
          setError(errText);
          setIsStreaming(false);
          setIsLoading(false);
        },
      });
    } catch (streamErr: any) {
      if (streamErr.name === 'AbortError') {
        // Stream aborted by user
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, isStreaming: false };
          }
          return copy;
        });
      } else {
        setError(streamErr.message || 'Communication error with AI service');
      }
      setIsStreaming(false);
      setIsLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  // Add network/console entries captured from DevTools as a new context source
  const addDevToolsAsContext = async (params: {
    title: string;
    url: string;
    selectedText: string;
    sourceType: string;
  }) => {
    try {
      const sid = sessionId || (await StorageService.getSessionId());

      if (activeConversation) {
        // Append to existing conversation
        const convId = activeConversation._id || activeConversation.id!;
        const updated = await ApiService.addContextSource(convId, params);
        setActiveConversation(updated);
      } else {
        // Create a new contextual conversation
        const newConv = await ApiService.createConversation({
          sessionId: sid,
          mode: 'context',
          title: `DevTools: ${params.title.slice(0, 30)}`,
          provider: activeProviderId,
          initialContext: params,
        });
        setActiveConversation(newConv);
        setMessages([]);
        await StorageService.setActiveConversationId(newConv._id || newConv.id!);
        setConversations(prev => [newConv, ...prev]);
      }
      setMode('context');
    } catch (err: any) {
      setError(err.message || 'Failed to add DevTools context');
    }
  };

  const regenerateResponse = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
          copy.pop();
        }
        return copy;
      });
      sendMessage(lastUserMsg.content);
    }
  };

  return {
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
  };
}
