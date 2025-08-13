import { Request, Response, NextFunction } from 'express';
import { PromptService } from '../services/PromptService';
import { 
  CreatePromptRequest, 
  UpdatePromptRequest, 
  SearchFilters, 
  ApiResponse,
  PaginatedResponse,
  Prompt 
} from '../types';
import { createAppError } from '../middleware/errorHandler';

export class PromptController {
  constructor(private promptService: PromptService) {}

  async createPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createRequest: CreatePromptRequest = req.body;
      const prompt = await this.promptService.createPrompt(createRequest);

      const response: ApiResponse<Prompt> = {
        success: true,
        data: prompt,
        message: 'Prompt created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prompt = await this.promptService.getPrompt(id!);

      if (!prompt) {
        throw createAppError('Prompt not found', 404);
      }

      const response: ApiResponse<Prompt> = {
        success: true,
        data: prompt,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async updatePrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateRequest: UpdatePromptRequest = req.body;
      
      const prompt = await this.promptService.updatePrompt(id!, updateRequest);

      if (!prompt) {
        throw createAppError('Prompt not found', 404);
      }

      const response: ApiResponse<Prompt> = {
        success: true,
        data: prompt,
        message: 'Prompt updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async deletePrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.promptService.deletePrompt(id!);

      if (!deleted) {
        throw createAppError('Prompt not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Prompt deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async listPrompts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: SearchFilters = {};
      
      if (req.query.tags) filters.tags = req.query.tags as string[];
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.title) filters.title = req.query.title as string;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string, 10);

      const result = await this.promptService.listPrompts(filters);

      const response: ApiResponse<PaginatedResponse<Prompt>> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async searchPrompts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      const filters: SearchFilters = {};
      
      if (req.query.tags) filters.tags = req.query.tags as string[];
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string, 10);

      const result = await this.promptService.searchPrompts(query, filters);

      const response: ApiResponse<PaginatedResponse<Prompt>> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await this.promptService.getCategories();

      const response: ApiResponse<string[]> = {
        success: true,
        data: categories,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await this.promptService.getTags();

      const response: ApiResponse<string[]> = {
        success: true,
        data: tags,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.promptService.getStats();

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}