/**
 * Contextly Content Script (updated)
 * - Monitors page context and handles selection queries safely
 * - Relays console interceptor messages to background service worker
 */

(() => {
  // ─── Selection listener for context menu ───────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_SELECTION') {
      const selection = window.getSelection()?.toString().trim() || '';
      sendResponse({
        selectedText: selection,
        url: window.location.href,
        title: document.title,
      });
    }
    return true;
  });

  // ─── Console log relay from injected interceptor ───────────────────────────
  // The DevTools page injects a script that overrides console methods and
  // posts messages via window.postMessage. We relay them to the background.
  window.addEventListener('message', (event) => {
    // Only process messages from our injected interceptor
    if (
      event.source === window &&
      event.data &&
      event.data.__contextlyConsole === true
    ) {
      chrome.runtime.sendMessage({
        type: 'DEVTOOLS_CONSOLE_CAPTURED',
        payload: {
          id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
          level: event.data.level,
          message: event.data.message,
          url: window.location.href,
          timestamp: event.data.timestamp || Date.now(),
        },
      }).catch(() => {
        // Extension may not be ready
      });
    }
  });
})();
