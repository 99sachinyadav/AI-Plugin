/**
 * Contextly DevTools Page
 *
 * Runs inside the Chrome DevTools context.
 * Captures Network requests and Console logs from the inspected page
 * and sends them to the background service worker for the sidepanel to consume.
 */

type CapturedNetworkEntry = {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  type: string;
  size: number;
  duration: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timestamp: number;
};

type CapturedConsoleEntry = {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  url?: string;
  line?: number;
  timestamp: number;
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// ─── Network Request Capture ─────────────────────────────────────────────────

chrome.devtools.network.onRequestFinished.addListener((request) => {
  // Filter out extension requests and noise
  const url = request.request.url;
  if (url.startsWith('chrome-extension://') || url.startsWith('data:')) return;

  const headers: Record<string, string> = {};
  for (const h of request.request.headers || []) {
    headers[h.name.toLowerCase()] = h.value;
  }

  const entry: CapturedNetworkEntry = {
    id: generateId(),
    url,
    method: request.request.method,
    status: request.response.status,
    statusText: request.response.statusText,
    type: request.response.content?.mimeType || 'unknown',
    size: request.response.content?.size || 0,
    duration: request.time || 0,
    requestHeaders: headers,
    requestBody: request.request.postData?.text || undefined,
    timestamp: Date.now(),
  };

  // Try to get response body (may not be available for all requests)
  request.getContent((content, _encoding) => {
    if (content && content.length < 50_000) {
      entry.responseBody = content;
    }

    chrome.runtime.sendMessage({
      type: 'DEVTOOLS_NETWORK_CAPTURED',
      tabId: chrome.devtools.inspectedWindow.tabId,
      payload: entry,
    }).catch(() => {
      // Sidepanel may not be open yet, that's fine
    });
  });
});

// ─── Console Log Capture via Page Script Injection ───────────────────────────

// Inject a small interceptor into the inspected page that captures console output.
// It relays logs back to the content script via window.postMessage.
const CONSOLE_INTERCEPTOR = `
(function() {
  if (window.__contextlyConsoleHooked) return;
  window.__contextlyConsoleHooked = true;

  const levels = ['log', 'warn', 'error', 'info', 'debug'];
  levels.forEach(function(level) {
    const original = console[level].bind(console);
    console[level] = function(...args) {
      original.apply(console, args);
      try {
        window.postMessage({
          __contextlyConsole: true,
          level: level,
          message: args.map(function(a) {
            try {
              return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
            } catch(e) {
              return String(a);
            }
          }).join(' '),
          timestamp: Date.now(),
        }, '*');
      } catch(e) {}
    };
  });
})();
`;

// Inject on page navigation
function injectConsoleInterceptor() {
  chrome.devtools.inspectedWindow.eval(CONSOLE_INTERCEPTOR, (result, exceptionInfo) => {
    if (exceptionInfo) {
      console.warn('[Contextly DevTools] Console interceptor injection error:', exceptionInfo.value);
    }
  });
}

// Also inject immediately when devtools opens
injectConsoleInterceptor();

// Re-inject on page navigation
chrome.devtools.network.onNavigated.addListener(() => {
  setTimeout(injectConsoleInterceptor, 300);
});
