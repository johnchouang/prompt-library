import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createPromptRoutes } from './routes/promptRoutes';
import { PromptController } from './controllers/PromptController';
import { PromptService } from './services/PromptService';
import { FileStorage } from './storage/FileStorage';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ApiResponse } from './types';

export const createApp = async (): Promise<express.Application> => {
  const app = express();

  // Security and logging middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize services
  const storage = new FileStorage();
  const promptService = new PromptService(storage);
  await promptService.initialize();

  const promptController = new PromptController(promptService);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    const response: ApiResponse = {
      success: true,
      message: 'Prompt Library Service is running',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      },
    };
    res.json(response);
  });

  // API info endpoint
  app.get('/api', (_req, res) => {
    const response: ApiResponse = {
      success: true,
      message: 'Prompt Library API v1',
      data: {
        version: 'v1',
        endpoints: {
          'GET /api/v1/prompts': 'List all prompts with optional filtering',
          'POST /api/v1/prompts': 'Create a new prompt',
          'GET /api/v1/prompts/search?q=query': 'Search prompts',
          'GET /api/v1/prompts/categories': 'Get all categories',
          'GET /api/v1/prompts/tags': 'Get all tags',
          'GET /api/v1/prompts/stats': 'Get usage statistics',
          'GET /api/v1/prompts/:id': 'Get a specific prompt',
          'PUT /api/v1/prompts/:id': 'Update a specific prompt',
          'DELETE /api/v1/prompts/:id': 'Delete a specific prompt',
        },
        documentation: '/api/v1/docs',
      },
    };
    res.json(response);
  });

  // API routes
  app.use('/api/v1/prompts', createPromptRoutes(promptController));

  // API documentation endpoint
  app.get('/api/v1/docs', (_req, res) => {
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'Prompt Library API',
        version: '1.0.0',
        description: 'A REST API for managing prompts with file-based storage',
      },
      servers: [
        {
          url: '/api/v1',
          description: 'API v1',
        },
      ],
      paths: {
        '/prompts': {
          get: {
            summary: 'List prompts',
            description: 'Get a paginated list of prompts with optional filtering',
            parameters: [
              {
                name: 'tags',
                in: 'query',
                description: 'Filter by tags (comma-separated)',
                schema: { type: 'string' },
              },
              {
                name: 'category',
                in: 'query',
                description: 'Filter by category',
                schema: { type: 'string' },
              },
              {
                name: 'title',
                in: 'query',
                description: 'Filter by title or description',
                schema: { type: 'string' },
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page (max 100)',
                schema: { type: 'integer', default: 50 },
              },
              {
                name: 'offset',
                in: 'query',
                description: 'Number of items to skip',
                schema: { type: 'integer', default: 0 },
              },
            ],
          },
          post: {
            summary: 'Create prompt',
            description: 'Create a new prompt',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['title', 'content', 'tags', 'category'],
                    properties: {
                      title: { type: 'string', maxLength: 200 },
                      content: { type: 'string', maxLength: 50000 },
                      description: { type: 'string', maxLength: 1000 },
                      tags: { 
                        type: 'array', 
                        items: { type: 'string' },
                        maxItems: 20 
                      },
                      category: { type: 'string', maxLength: 100 },
                      variables: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            type: { enum: ['string', 'number', 'boolean', 'array'] },
                            required: { type: 'boolean' },
                            defaultValue: {},
                          },
                        },
                      },
                      author: { type: 'string', maxLength: 100 },
                    },
                  },
                },
              },
            },
          },
        },
        '/prompts/search': {
          get: {
            summary: 'Search prompts',
            description: 'Search prompts by query string',
            parameters: [
              {
                name: 'q',
                in: 'query',
                required: true,
                description: 'Search query',
                schema: { type: 'string' },
              },
            ],
          },
        },
        '/prompts/{id}': {
          get: {
            summary: 'Get prompt',
            description: 'Get a specific prompt by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Prompt ID',
                schema: { type: 'string', format: 'uuid' },
              },
            ],
          },
          put: {
            summary: 'Update prompt',
            description: 'Update a specific prompt',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Prompt ID',
                schema: { type: 'string', format: 'uuid' },
              },
            ],
          },
          delete: {
            summary: 'Delete prompt',
            description: 'Delete a specific prompt',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Prompt ID',
                schema: { type: 'string', format: 'uuid' },
              },
            ],
          },
        },
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};