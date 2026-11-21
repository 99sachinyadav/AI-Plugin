import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConversationService } from '../services/conversation.service';
import { AIService } from '../services/ai.service';
import { AIProviderFactory } from '../providers/AIProviderFactory';

const ChatMessageSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  content: z.string().min(1, 'Message content cannot be empty'),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export class ChatController {
  /**
   * SSE Streaming Chat Handler
   */
  static async streamChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ChatMessageSchema.parse(req.body);
      const { conversationId, content, provider: requestedProvider, model } = validated;

      // 1. Fetch conversation
      const conversation = await ConversationService.getById(conversationId);
      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      // 2. Save user message to persistent storage
      const userMessage = await ConversationService.saveMessage({
        conversationId,
        role: 'user',
        content,
      });

      // 3. Retrieve recent message history for context
      const history = await ConversationService.getMessages(conversationId);

      // Auto-update conversation title if it is the first user message
      if (conversation.title === 'New Conversation' || conversation.title.startsWith('Context: Untitled')) {
        const generatedTitle = content.length > 35 ? content.substring(0, 35) + '...' : content;
        await ConversationService.updateTitle(conversationId, generatedTitle);
      }

      // Format messages for AI service
      const messages = history.map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content as string,
      }));

      // Set headers for Server-Sent Events (SSE)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Track client abort
      let isAborted = false;
      req.on('close', () => {
        isAborted = true;
      });

      // Determine active provider
      const targetProvider = requestedProvider || conversation.provider;

      // Send initial event with metadata
      res.write(`event: start\ndata: ${JSON.stringify({
        conversationId,
        userMessageId: userMessage._id || userMessage.id,
        mode: conversation.mode,
        provider: targetProvider,
      })}\n\n`);

      let fullAssistantReply = '';
      let activeModel = model;

      try {
        const streamIterator = AIService.stream({
          messages,
          mode: conversation.mode,
          contextSources: conversation.contextSources,
          providerId: targetProvider,
          model,
        });

        for await (const chunk of streamIterator) {
          if (isAborted) break;

          if (chunk.text) {
            fullAssistantReply += chunk.text;
            res.write(`event: token\ndata: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
          }
          if (chunk.model) {
            activeModel = chunk.model;
          }
        }

        // Save completed assistant message to persistent storage
        if (fullAssistantReply.trim().length > 0) {
          const assistantMessage = await ConversationService.saveMessage({
            conversationId,
            role: 'assistant',
            content: fullAssistantReply,
            provider: targetProvider,
            model: activeModel,
          });

          res.write(`event: done\ndata: ${JSON.stringify({
            messageId: assistantMessage._id || assistantMessage.id,
            fullContent: fullAssistantReply,
            provider: targetProvider,
            model: activeModel,
          })}\n\n`);
        } else {
          res.write(`event: done\ndata: ${JSON.stringify({
            fullContent: fullAssistantReply,
          })}\n\n`);
        }

        res.end();
      } catch (streamError: any) {
        if (!isAborted) {
          res.write(`event: error\ndata: ${JSON.stringify({
            error: streamError.message || 'Stream generation failed',
          })}\n\n`);
          res.end();
        }
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Standard JSON Non-Streaming Chat Handler
   */
  static async standardChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ChatMessageSchema.parse(req.body);
      const { conversationId, content, provider: requestedProvider, model } = validated;

      const conversation = await ConversationService.getById(conversationId);
      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      await ConversationService.saveMessage({
        conversationId,
        role: 'user',
        content,
      });

      const history = await ConversationService.getMessages(conversationId);
      const messages = history.map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content as string,
      }));

      const targetProvider = requestedProvider || conversation.provider;

      const result = await AIService.generate({
        messages,
        mode: conversation.mode,
        contextSources: conversation.contextSources,
        providerId: targetProvider,
        model,
      });

      const assistantMessage = await ConversationService.saveMessage({
        conversationId,
        role: 'assistant',
        content: result.text,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.usage?.totalTokens,
      });

      res.json({
        success: true,
        message: assistantMessage,
        usage: result.usage,
      });
    } catch (error) {
      next(error);
    }
  }
}
