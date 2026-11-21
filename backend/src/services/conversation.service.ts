import mongoose from 'mongoose';
import { Conversation, IConversation, IContextSource } from '../models/Conversation';
import { Message, IMessage } from '../models/Message';

export interface CreateConversationDTO {
  sessionId: string;
  userId?: string;
  title?: string;
  mode?: 'general' | 'context';
  provider?: string;
  initialContext?: {
    title: string;
    url: string;
    selectedText: string;
    sourceType?: string;
  };
}

// In-memory fallback stores when MongoDB is not connected (useful for quick local dev or offline tests)
interface MemConversation {
  id: string;
  _id: string;
  sessionId: string;
  userId?: string;
  title: string;
  mode: 'general' | 'context';
  provider: string;
  contextSources: IContextSource[];
  createdAt: Date;
  updatedAt: Date;
}

interface MemMessage {
  id: string;
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const memoryConversations = new Map<string, MemConversation>();
const memoryMessages: MemMessage[] = [];

export class ConversationService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  static async create(data: CreateConversationDTO): Promise<any> {
    const contextSources: IContextSource[] = [];
    if (data.initialContext && data.initialContext.selectedText) {
      contextSources.push({
        title: data.initialContext.title || 'Webpage Context',
        url: data.initialContext.url || '',
        selectedText: data.initialContext.selectedText,
        sourceType: data.initialContext.sourceType || 'webpage_selection',
        createdAt: new Date(),
      });
    }

    const title = data.title || (contextSources.length > 0 && contextSources[0].title
      ? `Context: ${contextSources[0].title.slice(0, 30)}`
      : 'New Conversation');

    if (this.isMongoConnected()) {
      const conv = new Conversation({
        sessionId: data.sessionId,
        userId: data.userId,
        title,
        mode: data.mode || (contextSources.length > 0 ? 'context' : 'general'),
        provider: data.provider || 'gemini',
        contextSources,
      });
      return await conv.save();
    } else {
      // Memory fallback
      const id = new mongoose.Types.ObjectId().toString();
      const memConv: MemConversation = {
        id,
        _id: id,
        sessionId: data.sessionId,
        userId: data.userId,
        title,
        mode: data.mode || (contextSources.length > 0 ? 'context' : 'general'),
        provider: data.provider || 'gemini',
        contextSources: contextSources.map(cs => ({ ...cs, _id: new mongoose.Types.ObjectId().toString() })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryConversations.set(id, memConv);
      return memConv;
    }
  }

  static async listBySession(sessionId: string): Promise<any[]> {
    if (this.isMongoConnected()) {
      return await Conversation.find({ sessionId }).sort({ updatedAt: -1 }).lean();
    } else {
      return Array.from(memoryConversations.values())
        .filter(c => c.sessionId === sessionId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
  }

  static async getById(id: string): Promise<any | null> {
    if (this.isMongoConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await Conversation.findById(id).lean();
    } else {
      return memoryConversations.get(id) || null;
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    if (this.isMongoConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await Conversation.findByIdAndDelete(id);
      if (res) {
        await Message.deleteMany({ conversationId: id });
        return true;
      }
      return false;
    } else {
      const existed = memoryConversations.delete(id);
      if (existed) {
        const toDeleteIndices: number[] = [];
        memoryMessages.forEach((m, idx) => {
          if (m.conversationId === id) toDeleteIndices.push(idx);
        });
        for (let i = toDeleteIndices.length - 1; i >= 0; i--) {
          memoryMessages.splice(toDeleteIndices[i], 1);
        }
      }
      return existed;
    }
  }

  static async addContextSource(conversationId: string, source: {
    title: string;
    url: string;
    selectedText: string;
    sourceType?: string;
  }): Promise<any> {
    const newSource: IContextSource = {
      title: source.title || 'Untitled',
      url: source.url || '',
      selectedText: source.selectedText,
      sourceType: source.sourceType || 'webpage_selection',
      createdAt: new Date(),
    };

    if (this.isMongoConnected()) {
      const conv = await Conversation.findById(conversationId);
      if (!conv) throw new Error('Conversation not found');

      conv.contextSources.push(newSource);
      conv.mode = 'context';
      conv.updatedAt = new Date();
      return await conv.save();
    } else {
      const conv = memoryConversations.get(conversationId);
      if (!conv) throw new Error('Conversation not found');

      const sourceWithId = { ...newSource, _id: new mongoose.Types.ObjectId().toString() };
      conv.contextSources.push(sourceWithId);
      conv.mode = 'context';
      conv.updatedAt = new Date();
      return conv;
    }
  }

  static async removeContextSource(conversationId: string, contextId: string): Promise<any> {
    if (this.isMongoConnected()) {
      const conv = await Conversation.findById(conversationId);
      if (!conv) throw new Error('Conversation not found');

      conv.contextSources = conv.contextSources.filter(
        (src: any) => src._id.toString() !== contextId && src.id !== contextId
      );
      conv.updatedAt = new Date();
      return await conv.save();
    } else {
      const conv = memoryConversations.get(conversationId);
      if (!conv) throw new Error('Conversation not found');

      conv.contextSources = conv.contextSources.filter(
        (src: any) => (src._id && src._id.toString() !== contextId) && src.id !== contextId
      );
      conv.updatedAt = new Date();
      return conv;
    }
  }

  static async updateTitle(conversationId: string, title: string): Promise<any> {
    if (this.isMongoConnected()) {
      return await Conversation.findByIdAndUpdate(conversationId, { title, updatedAt: new Date() }, { new: true });
    } else {
      const conv = memoryConversations.get(conversationId);
      if (conv) {
        conv.title = title;
        conv.updatedAt = new Date();
      }
      return conv;
    }
  }

  static async updateMode(conversationId: string, mode: 'general' | 'context'): Promise<any> {
    if (this.isMongoConnected()) {
      return await Conversation.findByIdAndUpdate(conversationId, { mode, updatedAt: new Date() }, { new: true });
    } else {
      const conv = memoryConversations.get(conversationId);
      if (conv) {
        conv.mode = mode;
        conv.updatedAt = new Date();
      }
      return conv;
    }
  }

  static async saveMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    provider?: string;
    model?: string;
    tokensUsed?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    if (this.isMongoConnected()) {
      const msg = new Message(data);
      const saved = await msg.save();
      await Conversation.findByIdAndUpdate(data.conversationId, { updatedAt: new Date() });
      return saved;
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      const memMsg: MemMessage = {
        id,
        _id: id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        provider: data.provider,
        model: data.model,
        tokensUsed: data.tokensUsed || 0,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryMessages.push(memMsg);
      const conv = memoryConversations.get(data.conversationId);
      if (conv) {
        conv.updatedAt = new Date();
      }
      return memMsg;
    }
  }

  static async getMessages(conversationId: string): Promise<any[]> {
    if (this.isMongoConnected()) {
      return await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    } else {
      return memoryMessages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
  }

  // Clear memory for testing purposes
  static clearMemory(): void {
    memoryConversations.clear();
    memoryMessages.length = 0;
  }
}
