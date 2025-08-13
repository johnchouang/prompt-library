import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('API Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Prompt Library Service is running');
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('v1');
      expect(response.body.data.endpoints).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('should return OpenAPI documentation', async () => {
      const response = await request(app)
        .get('/api/v1/docs')
        .expect(200);

      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info.title).toBe('Prompt Library API');
      expect(response.body.paths).toBeDefined();
    });
  });

  describe('Prompt CRUD Operations', () => {
    let createdPromptId: string;

    const testPrompt = {
      title: 'Test API Prompt',
      content: 'This is a test prompt for API testing',
      description: 'A comprehensive test prompt',
      tags: ['test', 'api', 'integration'],
      category: 'testing',
      variables: [
        {
          name: 'user_name',
          description: 'The name of the user',
          type: 'string' as const,
          required: true,
          defaultValue: 'Anonymous',
        },
      ],
      author: 'Test Suite',
    };

    describe('POST /api/v1/prompts', () => {
      it('should create a new prompt', async () => {
        const response = await request(app)
          .post('/api/v1/prompts')
          .send(testPrompt)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(testPrompt.title);
        expect(response.body.data.content).toBe(testPrompt.content);
        expect(response.body.data.tags).toEqual(testPrompt.tags);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.metadata).toBeDefined();
        expect(response.body.data.metadata.version).toBe('1.0.0');

        createdPromptId = response.body.data.id;
      });

      it('should validate required fields', async () => {
        const invalidPrompt = {
          title: 'Test',
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/v1/prompts')
          .send(invalidPrompt)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation error');
      });

      it('should validate field lengths', async () => {
        const invalidPrompt = {
          title: 'a'.repeat(201), // Too long
          content: 'Test content',
          tags: ['test'],
          category: 'testing',
        };

        const response = await request(app)
          .post('/api/v1/prompts')
          .send(invalidPrompt)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation error');
      });
    });

    describe('GET /api/v1/prompts/:id', () => {
      it('should retrieve a prompt by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/prompts/${createdPromptId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(createdPromptId);
        expect(response.body.data.title).toBe(testPrompt.title);
        expect(response.body.data.metadata.usage).toBeGreaterThan(0); // Should increment
      });

      it('should return 404 for non-existent prompt', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .get(`/api/v1/prompts/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Prompt not found');
      });

      it('should validate UUID format', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation error');
      });
    });

    describe('PUT /api/v1/prompts/:id', () => {
      it('should update a prompt', async () => {
        const updateData = {
          title: 'Updated Test Prompt',
          description: 'Updated description',
          tags: ['updated', 'test'],
        };

        const response = await request(app)
          .put(`/api/v1/prompts/${createdPromptId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.description).toBe(updateData.description);
        expect(response.body.data.tags).toEqual(updateData.tags);
        expect(response.body.data.content).toBe(testPrompt.content); // Should remain unchanged
        expect(response.body.data.metadata.version).toBe('1.0.1'); // Should increment
      });

      it('should return 404 for non-existent prompt', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .put(`/api/v1/prompts/${fakeId}`)
          .send({ title: 'Updated' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Prompt not found');
      });

      it('should require at least one field to update', async () => {
        const response = await request(app)
          .put(`/api/v1/prompts/${createdPromptId}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation error');
      });
    });

    describe('GET /api/v1/prompts', () => {
      beforeAll(async () => {
        // Create additional test prompts
        const additionalPrompts = [
          {
            title: 'Python Tutorial',
            content: 'Learn Python programming',
            tags: ['python', 'programming'],
            category: 'coding',
          },
          {
            title: 'Creative Writing Guide',
            content: 'Tips for creative writing',
            tags: ['writing', 'creative'],
            category: 'creative',
          },
        ];

        for (const prompt of additionalPrompts) {
          await request(app)
            .post('/api/v1/prompts')
            .send(prompt);
        }
      });

      it('should list all prompts', async () => {
        const response = await request(app)
          .get('/api/v1/prompts')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toBeDefined();
        expect(response.body.data.total).toBeGreaterThan(0);
        expect(response.body.data.limit).toBe(50);
        expect(response.body.data.offset).toBe(0);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get('/api/v1/prompts?category=coding')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items.every((p: any) => p.category === 'coding')).toBe(true);
      });

      it('should filter by tags', async () => {
        const response = await request(app)
          .get('/api/v1/prompts?tags=programming')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items.some((p: any) => p.tags.includes('programming'))).toBe(true);
      });

      it('should filter by multiple tags', async () => {
        const response = await request(app)
          .get('/api/v1/prompts?tags=programming,python')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items.some((p: any) => 
          p.tags.includes('programming') || p.tags.includes('python')
        )).toBe(true);
      });

      it('should apply pagination', async () => {
        const response = await request(app)
          .get('/api/v1/prompts?limit=2&offset=1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.limit).toBe(2);
        expect(response.body.data.offset).toBe(1);
        expect(response.body.data.items.length).toBeLessThanOrEqual(2);
      });

      it('should validate pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/prompts?limit=invalid')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation error');
      });
    });

    describe('GET /api/v1/prompts/search', () => {
      it('should search prompts by query', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/search?q=Python')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items.some((p: any) => 
          p.title.includes('Python') || p.content.includes('Python')
        )).toBe(true);
      });

      it('should require search query', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/search')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation error');
      });

      it('should search with additional filters', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/search?q=programming&category=coding')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items.every((p: any) => p.category === 'coding')).toBe(true);
      });
    });

    describe('GET /api/v1/prompts/categories', () => {
      it('should return available categories', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/categories')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/v1/prompts/tags', () => {
      it('should return available tags', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/tags')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/v1/prompts/stats', () => {
      it('should return usage statistics', async () => {
        const response = await request(app)
          .get('/api/v1/prompts/stats')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalPrompts).toBeGreaterThan(0);
        expect(response.body.data.totalCategories).toBeGreaterThan(0);
        expect(response.body.data.totalTags).toBeGreaterThan(0);
        expect(Array.isArray(response.body.data.mostUsedPrompts)).toBe(true);
      });
    });

    describe('DELETE /api/v1/prompts/:id', () => {
      it('should delete a prompt', async () => {
        const response = await request(app)
          .delete(`/api/v1/prompts/${createdPromptId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Prompt deleted successfully');

        // Verify deletion
        await request(app)
          .get(`/api/v1/prompts/${createdPromptId}`)
          .expect(404);
      });

      it('should return 404 for non-existent prompt', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        const response = await request(app)
          .delete(`/api/v1/prompts/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Prompt not found');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown/route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/prompts')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });
});