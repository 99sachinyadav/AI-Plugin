import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Terminal,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Bug,
  Wifi,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { CapturedNetworkEntry, CapturedConsoleEntry, ConsoleLevel } from '../../types';

interface DevToolsPanelProps {
  onAddAsContext: (params: { title: string; url: string; selectedText: string; sourceType: string }) => void;
  onSwitchToContextMode: () => void;
}

type DevToolsTab = 'network' | 'console';

function getActiveTabId(): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      resolve(null);
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.id ?? null);
    });
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: number }> = ({ status }) => {
  const isSuccess = status >= 200 && status < 300;
  const isRedirect = status >= 300 && status < 400;
  const isError = status >= 400;

  return (
    <span
      className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold leading-none ${
        isSuccess
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
          : isRedirect
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
          : isError
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {isSuccess && <CheckCircle2 className="h-2.5 w-2.5" />}
      {isError && <XCircle className="h-2.5 w-2.5" />}
      {status}
    </span>
  );
};

const ConsoleLevelBadge: React.FC<{ level: ConsoleLevel }> = ({ level }) => {
  const styles: Record<ConsoleLevel, string> = {
    error: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    log: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    info: 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300',
    debug: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  };

  const Icon = level === 'error' ? XCircle : level === 'warn' ? AlertTriangle : level === 'info' ? Info : Bug;

  return (
    <span className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold leading-none uppercase ${styles[level]}`}>
      <Icon className="h-2.5 w-2.5" />
      {level}
    </span>
  );
};

// ─── Network Entry Row ────────────────────────────────────────────────────────
const NetworkRow: React.FC<{
  entry: CapturedNetworkEntry;
  isSelected: boolean;
  onToggle: () => void;
  onAddSingle: () => void;
}> = ({ entry, isSelected, onToggle, onAddSingle }) => {
  const [expanded, setExpanded] = useState(false);

  const shortUrl = entry.url.length > 55
    ? entry.url.substring(0, 52) + '...'
    : entry.url;

  return (
    <div className={`group border-b border-slate-100 dark:border-slate-800/60 ${isSelected ? 'bg-brand-50/60 dark:bg-brand-950/20' : ''}`}>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-3 w-3 cursor-pointer accent-brand-600"
        />

        <span className="w-10 shrink-0 text-center text-[10px] font-bold text-slate-500">
          {entry.method}
        </span>

        <StatusBadge status={entry.status} />

        <span
          title={entry.url}
          className="flex-1 truncate font-mono text-[11px] text-slate-700 dark:text-slate-300"
        >
          {shortUrl}
        </span>

        <button
          type="button"
          title="Add this request as context"
          onClick={onAddSingle}
          className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {expanded && (
        <div className="bg-slate-900 px-3 py-2 font-mono text-[10px] text-slate-300 overflow-x-auto">
          <div className="mb-1 text-slate-400 uppercase text-[9px]">Full URL</div>
          <div className="break-all text-brand-300 mb-2">{entry.url}</div>

          {entry.requestBody && (
            <>
              <div className="mt-1 mb-0.5 text-slate-400 uppercase text-[9px]">Request Body</div>
              <pre className="whitespace-pre-wrap text-amber-200">{entry.requestBody.substring(0, 2000)}</pre>
            </>
          )}

          {entry.responseBody && (
            <>
              <div className="mt-1 mb-0.5 text-slate-400 uppercase text-[9px]">Response Body</div>
              <pre className="whitespace-pre-wrap text-emerald-300">{entry.responseBody.substring(0, 3000)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Console Entry Row ────────────────────────────────────────────────────────
const ConsoleRow: React.FC<{
  entry: CapturedConsoleEntry;
  isSelected: boolean;
  onToggle: () => void;
  onAddSingle: () => void;
}> = ({ entry, isSelected, onToggle, onAddSingle }) => (
  <div className={`group flex items-start gap-1.5 border-b border-slate-100 dark:border-slate-800/60 px-2 py-1.5 ${isSelected ? 'bg-brand-50/60 dark:bg-brand-950/20' : ''}`}>
    <input
      type="checkbox"
      checked={isSelected}
      onChange={onToggle}
      className="mt-0.5 h-3 w-3 cursor-pointer accent-brand-600"
    />

    <ConsoleLevelBadge level={entry.level} />

    <span className="flex-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all leading-relaxed">
      {entry.message.length > 400 ? entry.message.substring(0, 400) + '…' : entry.message}
    </span>

    <button
      type="button"
      title="Add this log as context"
      onClick={onAddSingle}
      className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-opacity"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

// ─── Main DevTools Panel ──────────────────────────────────────────────────────
export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ onAddAsContext, onSwitchToContextMode }) => {
  const [activeTab, setActiveTab] = useState<DevToolsTab>('network');
  const [networkEntries, setNetworkEntries] = useState<CapturedNetworkEntry[]>([]);
  const [consoleEntries, setConsoleEntries] = useState<CapturedConsoleEntry[]>([]);
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<Set<string>>(new Set());
  const [selectedConsoleIds, setSelectedConsoleIds] = useState<Set<string>>(new Set());
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // ─── Load initial buffered entries & subscribe to live updates ─────────────
  useEffect(() => {
    getActiveTabId().then(async (tabId) => {
      if (!tabId) return;
      setCurrentTabId(tabId);

      // Request buffered entries from background
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          { type: 'GET_DEVTOOLS_ENTRIES', tabId },
          (response) => {
            if (response) {
              setNetworkEntries(response.network || []);
              setConsoleEntries(response.console || []);
            }
          }
        );
      }
    });

    // Live listener for new entries arriving from background
    const handleMessage = (message: any) => {
      if (message.type === 'DEVTOOLS_NETWORK_UPDATE') {
        setNetworkEntries(prev => [...prev, message.payload].slice(-200));
      }
      if (message.type === 'DEVTOOLS_CONSOLE_UPDATE') {
        setConsoleEntries(prev => [...prev, message.payload].slice(-200));
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, []);

  // Auto-scroll to latest entry when in console tab
  useEffect(() => {
    if (activeTab === 'console') {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleEntries, activeTab]);

  // ─── Clear handlers ────────────────────────────────────────────────────────
  const clearNetwork = () => {
    setNetworkEntries([]);
    setSelectedNetworkIds(new Set());
    if (currentTabId && typeof chrome !== 'undefined') {
      chrome.runtime.sendMessage({ type: 'CLEAR_DEVTOOLS_ENTRIES', tabId: currentTabId, kind: 'network' }).catch(() => {});
    }
  };

  const clearConsole = () => {
    setConsoleEntries([]);
    setSelectedConsoleIds(new Set());
    if (currentTabId && typeof chrome !== 'undefined') {
      chrome.runtime.sendMessage({ type: 'CLEAR_DEVTOOLS_ENTRIES', tabId: currentTabId, kind: 'console' }).catch(() => {});
    }
  };

  // ─── Add selected as context ───────────────────────────────────────────────
  const addSelectedAsContext = () => {
    const pageUrl = typeof chrome !== 'undefined'
      ? ''
      : window.location.href;

    if (activeTab === 'network') {
      const selected = networkEntries.filter(e => selectedNetworkIds.has(e.id));
      if (selected.length === 0) return;

      const content = selected.map(e => {
        let text = `[${e.method}] ${e.url}\nStatus: ${e.status} ${e.statusText}`;
        if (e.requestBody) text += `\nRequest Body:\n${e.requestBody.substring(0, 2000)}`;
        if (e.responseBody) text += `\nResponse Body:\n${e.responseBody.substring(0, 3000)}`;
        return text;
      }).join('\n\n---\n\n');

      onAddAsContext({
        title: `Network Requests (${selected.length})`,
        url: selected[0]?.url || pageUrl,
        selectedText: content,
        sourceType: 'network_request',
      });
    } else {
      const selected = consoleEntries.filter(e => selectedConsoleIds.has(e.id));
      if (selected.length === 0) return;

      const content = selected.map(e =>
        `[${e.level.toUpperCase()}] ${e.message}`
      ).join('\n');

      onAddAsContext({
        title: `Console Logs (${selected.length} entries)`,
        url: selected[0]?.url || pageUrl,
        selectedText: content,
        sourceType: 'console_log',
      });
    }

    onSwitchToContextMode();
    setSelectedNetworkIds(new Set());
    setSelectedConsoleIds(new Set());
  };

  const addSingleNetworkEntry = (e: CapturedNetworkEntry) => {
    let text = `[${e.method}] ${e.url}\nStatus: ${e.status} ${e.statusText}`;
    if (e.requestBody) text += `\nRequest Body:\n${e.requestBody.substring(0, 2000)}`;
    if (e.responseBody) text += `\nResponse Body:\n${e.responseBody.substring(0, 3000)}`;

    onAddAsContext({
      title: `${e.method} ${new URL(e.url).pathname}`,
      url: e.url,
      selectedText: text,
      sourceType: 'network_request',
    });
    onSwitchToContextMode();
  };

  const addSingleConsoleEntry = (e: CapturedConsoleEntry) => {
    onAddAsContext({
      title: `Console: ${e.level.toUpperCase()}`,
      url: e.url || '',
      selectedText: `[${e.level.toUpperCase()}] ${e.message}`,
      sourceType: 'console_log',
    });
    onSwitchToContextMode();
  };

  const toggleNetworkSelect = (id: string) => {
    setSelectedNetworkIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleConsoleSelect = (id: string) => {
    setSelectedConsoleIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedCount = activeTab === 'network' ? selectedNetworkIds.size : selectedConsoleIds.size;

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 mx-3 my-2 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-1">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeTab === 'network'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Network className="h-3 w-3" />
            Network
            {networkEntries.length > 0 && (
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                {networkEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeTab === 'console'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3 w-3" />
            Console
            {consoleEntries.length > 0 && (
              <span className={`rounded-full px-1 text-[9px] font-bold ${
                consoleEntries.some(e => e.level === 'error')
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {consoleEntries.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={addSelectedAsContext}
              className="flex items-center gap-1 rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-brand-500 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add {selectedCount} as Context
            </button>
          )}

          <button
            type="button"
            title={`Clear ${activeTab}`}
            onClick={activeTab === 'network' ? clearNetwork : clearConsole}
            className="rounded p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {activeTab === 'network' && (
          <>
            {networkEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Wifi className="h-6 w-6 opacity-30" />
                <p>Waiting for network requests...</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-500">Open DevTools first, then navigate or use the page.</p>
              </div>
            ) : (
              networkEntries.slice().reverse().map(entry => (
                <NetworkRow
                  key={entry.id}
                  entry={entry}
                  isSelected={selectedNetworkIds.has(entry.id)}
                  onToggle={() => toggleNetworkSelect(entry.id)}
                  onAddSingle={() => addSingleNetworkEntry(entry)}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'console' && (
          <>
            {consoleEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Terminal className="h-6 w-6 opacity-30" />
                <p>No console output captured yet.</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-500">Open DevTools, run some actions, then come back.</p>
              </div>
            ) : (
              consoleEntries.map(entry => (
                <ConsoleRow
                  key={entry.id}
                  entry={entry}
                  isSelected={selectedConsoleIds.has(entry.id)}
                  onToggle={() => toggleConsoleSelect(entry.id)}
                  onAddSingle={() => addSingleConsoleEntry(entry)}
                />
              ))
            )}
            <div ref={listEndRef} />
          </>
        )}
      </div>
    </div>
  );
};
