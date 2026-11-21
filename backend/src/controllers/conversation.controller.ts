import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConversationService } from '../services/conversation.service';

const CreateConversationSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  userId: z.string().optional(),
  title: z.string().optional(),
  mode: z.enum(['general', 'context']).optional(),
  provider: z.string().optional(),
  initialContext: z.object({
    title: z.string().default('Untitled Webpage'),
    url: z.string().default(''),
    selectedText: z.string().min(1, 'selectedText is required'),
    sourceType: z.string().optional(),
  }).optional(),
});

const AddContextSchema = z.object({
  title: z.string().default('Untitled Webpage'),
  url: z.string().default(''),
  selectedText: z.string().min(1, 'selectedText is required'),
  sourceType: z.string().optional(),
});

const UpdateConversationSchema = z.object({
  title: z.string().optional(),
  mode: z.enum(['general', 'context']).optional(),
});

export class ConversationController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateConversationSchema.parse(req.body);
      const conversation = await ConversationService.create(validated);
      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);
      if (!sessionId) {
        res.status(400).json({ success: false, error: 'sessionId query parameter or x-session-id header is required' });
        return;
      }

      const conversations = await ConversationService.listBySession(sessionId);
      res.json({
        success: true,
        conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversation = await ConversationService.getById(id);
      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      const messages = await ConversationService.getMessages(id);
      res.json({
        success: true,
        conversation,
        messages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const success = await ConversationService.deleteById(id);
      if (!success) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async addContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = AddContextSchema.parse(req.body);
      const updated = await ConversationService.addContextSource(id, validated);
      res.json({
        success: true,
        conversation: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, contextId } = req.params;
      const updated = await ConversationService.removeContextSource(id, contextId);
      res.json({
        success: true,
        conversation: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = UpdateConversationSchema.parse(req.body);
      let updated: any;
      if (validated.title) {
        updated = await ConversationService.updateTitle(id, validated.title);
      }
      if (validated.mode) {
        updated = await ConversationService.updateMode(id, validated.mode);
      }
      res.json({
        success: true,
        conversation: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
