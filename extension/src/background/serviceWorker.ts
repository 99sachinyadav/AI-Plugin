/**
 * Contextly Background Service Worker (Manifest V3)
 * Updated to handle DevTools Network and Console capture relay.
 */

const CONTEXT_MENU_ID = 'ask-contextly';

// ─── In-Memory DevTools Capture Buffers (per tabId) ──────────────────────────
// Stores recent captures so the sidepanel can retrieve them on demand.
const networkBuffer = new Map<number, any[]>();  // tabId → entries[]
const consoleBuffer = new Map<number, any[]>();  // tabId → entries[]
const MAX_BUFFER_ENTRIES = 200;

// ─── Initialization ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Ask Contextly',
      contexts: ['selection'],
    });
  });

  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('[Contextly] setPanelBehavior error:', err);
    });
  }
});

// ─── Context Menu: Webpage Text Selection ─────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText) {
    const pendingContext = {
      title: tab?.title || 'Webpage',
      url: tab?.url || '',
      selectedText: info.selectionText.trim(),
      sourceType: 'webpage_selection',
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ pendingContext });

    if (tab?.id && chrome.sidePanel && chrome.sidePanel.open) {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
      } catch {
        if (tab?.windowId) {
          await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
        }
      }
    }

    chrome.runtime.sendMessage({
      type: 'CONTEXT_CAPTURED',
      payload: pendingContext,
    }).catch(() => {});
  }
});

// ─── Message Router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // 1. Active tab info (for content script requests)
  if (message.type === 'GET_ACTIVE_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      sendResponse({ url: activeTab?.url || '', title: activeTab?.title || '' });
    });
    return true;
  }

  // 2. DevTools Network capture relay
  if (message.type === 'DEVTOOLS_NETWORK_CAPTURED' && message.payload) {
    const tabId = message.tabId as number;
    if (typeof tabId !== 'number') return;

    if (!networkBuffer.has(tabId)) networkBuffer.set(tabId, []);
    const entries = networkBuffer.get(tabId)!;
    entries.push(message.payload);
    if (entries.length > MAX_BUFFER_ENTRIES) entries.shift();

    // Broadcast to any open sidepanels
    chrome.runtime.sendMessage({
      type: 'DEVTOOLS_NETWORK_UPDATE',
      tabId,
      payload: message.payload,
    }).catch(() => {});
    return;
  }

  // 3. DevTools Console capture relay (from content script)
  if (message.type === 'DEVTOOLS_CONSOLE_CAPTURED' && message.payload) {
    const tabId = sender.tab?.id;
    if (typeof tabId !== 'number') return;

    if (!consoleBuffer.has(tabId)) consoleBuffer.set(tabId, []);
    const entries = consoleBuffer.get(tabId)!;
    entries.push(message.payload);
    if (entries.length > MAX_BUFFER_ENTRIES) entries.shift();

    chrome.runtime.sendMessage({
      type: 'DEVTOOLS_CONSOLE_UPDATE',
      tabId,
      payload: message.payload,
    }).catch(() => {});
    return;
  }

  // 4. Sidepanel requests all buffered DevTools entries for a tab
  if (message.type === 'GET_DEVTOOLS_ENTRIES') {
    const tabId = message.tabId as number;
    sendResponse({
      network: networkBuffer.get(tabId) || [],
      console: consoleBuffer.get(tabId) || [],
    });
    return true;
  }

  // 5. Clear DevTools buffers for a tab
  if (message.type === 'CLEAR_DEVTOOLS_ENTRIES') {
    const tabId = message.tabId as number;
    if (message.kind === 'network' || message.kind === 'all') networkBuffer.delete(tabId);
    if (message.kind === 'console' || message.kind === 'all') consoleBuffer.delete(tabId);
    sendResponse({ ok: true });
    return true;
  }
});
