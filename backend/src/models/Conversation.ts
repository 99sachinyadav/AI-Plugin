import mongoose, { Schema } from 'mongoose';

export interface IContextSource {
  id?: string;
  _id?: any;
  title: string;
  url: string;
  selectedText: string;
  sourceType: string;
  createdAt?: Date;
}

export const ContextSourceSchema = new Schema<IContextSource>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    selectedText: { type: String, required: true },
    sourceType: { type: String, default: 'webpage_selection' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

export interface IConversation {
  userId?: string;
  sessionId: string;
  title: string;
  mode: 'general' | 'context';
  provider: string;
  contextSources: IContextSource[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, sparse: true, index: true },
    sessionId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation', trim: true },
    mode: { type: String, enum: ['general', 'context'], default: 'general' },
    provider: { type: String, default: 'gemini' },
    contextSources: [ContextSourceSchema],
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ sessionId: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
