import { PendingContext } from '../types';

export class StorageService {
  private static SESSION_ID_KEY = 'contextly_session_id';
  private static ACTIVE_CONV_ID_KEY = 'contextly_active_conv_id';
  private static PENDING_CONTEXT_KEY = 'pendingContext';
  private static PREFERRED_PROVIDER_KEY = 'contextly_preferred_provider';

  static async getSessionId(): Promise<string> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get([this.SESSION_ID_KEY]);
        if (data[this.SESSION_ID_KEY]) return data[this.SESSION_ID_KEY];

        const newId = 'session_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        await chrome.storage.local.set({ [this.SESSION_ID_KEY]: newId });
        return newId;
      }
    } catch {
      // fallback
    }

    let localId = localStorage.getItem(this.SESSION_ID_KEY);
    if (!localId) {
      localId = 'session_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(this.SESSION_ID_KEY, localId);
    }
    return localId;
  }

  static async getActiveConversationId(): Promise<string | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get([this.ACTIVE_CONV_ID_KEY]);
        return data[this.ACTIVE_CONV_ID_KEY] || null;
      }
    } catch {
      // fallback
    }
    return localStorage.getItem(this.ACTIVE_CONV_ID_KEY);
  }

  static async setActiveConversationId(id: string | null): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        if (id) {
          await chrome.storage.local.set({ [this.ACTIVE_CONV_ID_KEY]: id });
        } else {
          await chrome.storage.local.remove([this.ACTIVE_CONV_ID_KEY]);
        }
        return;
      }
    } catch {
      // fallback
    }
    if (id) {
      localStorage.setItem(this.ACTIVE_CONV_ID_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_CONV_ID_KEY);
    }
  }

  static async getPendingContext(): Promise<PendingContext | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get([this.PENDING_CONTEXT_KEY]);
        return data[this.PENDING_CONTEXT_KEY] || null;
      }
    } catch {
      // fallback
    }
    const raw = localStorage.getItem(this.PENDING_CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static async clearPendingContext(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove([this.PENDING_CONTEXT_KEY]);
        return;
      }
    } catch {
      // fallback
    }
    localStorage.removeItem(this.PENDING_CONTEXT_KEY);
  }

  static async getPreferredProvider(): Promise<string | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get([this.PREFERRED_PROVIDER_KEY]);
        return data[this.PREFERRED_PROVIDER_KEY] || null;
      }
    } catch {
      // fallback
    }
    return localStorage.getItem(this.PREFERRED_PROVIDER_KEY);
  }

  static async setPreferredProvider(provider: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [this.PREFERRED_PROVIDER_KEY]: provider });
        return;
      }
    } catch {
      // fallback
    }
    localStorage.setItem(this.PREFERRED_PROVIDER_KEY, provider);
  }
}
