import { PromptService } from '../../src/services/PromptService';
import { StorageProvider, Prompt, CreatePromptRequest, UpdatePromptRequest } from '../../src/types';

// Mock storage provider
class MockStorageProvider implements StorageProvider {
  private data: Record<string, Prompt> = {};

  async load(): Promise<Record<string, Prompt>> {
    return { ...this.data };
  }

  async save(prompts: Record<string, Prompt>): Promise<void> {
    this.data = { ...prompts };
  }

  async backup(): Promise<void> {
    // Mock implementation
  }

  // Helper method for testing
  setData(data: Record<string, Prompt>): void {
    this.data = { ...data };
  }

  getData(): Record<string, Prompt> {
    return { ...this.data };
  }
}

describe('PromptService', () => {
  let service: PromptService;
  let mockStorage: MockStorageProvider;

  beforeEach(async () => {
    mockStorage = new MockStorageProvider();
    service = new PromptService(mockStorage);
    // Don't initialize here - let each test control initialization
  });

  describe('createPrompt', () => {
    it('should create a new prompt with valid data', async () => {
      await service.initialize();
      
      const request: CreatePromptRequest = {
        title: 'Test Prompt',
        content: 'This is a test prompt',
        description: 'A test description',
        tags: ['test', 'example'],
        category: 'testing',
        author: 'Test Author',
      };

      const prompt = await service.createPrompt(request);

      expect(prompt.id).toBeDefined();
      expect(prompt.title).toBe(request.title);
      expect(prompt.content).toBe(request.content);
      expect(prompt.description).toBe(request.description);
      expect(prompt.tags).toEqual(request.tags);
      expect(prompt.category).toBe(request.category);
      expect(prompt.metadata.author).toBe(request.author);
      expect(prompt.metadata.version).toBe('1.0.0');
      expect(prompt.metadata.usage).toBe(0);
    });

    it('should remove duplicate tags', async () => {
      await service.initialize();
      
      const request: CreatePromptRequest = {
        title: 'Test Prompt',
        content: 'Content',
        tags: ['test', 'example', 'test', 'duplicate', 'example'],
        category: 'testing',
      };

      const prompt = await service.createPrompt(request);

      expect(prompt.tags).toHaveLength(3);
      expect(prompt.tags).toContain('test');
      expect(prompt.tags).toContain('example');
      expect(prompt.tags).toContain('duplicate');
    });

    it('should save prompt to storage', async () => {
      await service.initialize();
      
      const request: CreatePromptRequest = {
        title: 'Test Prompt',
        content: 'Content',
        tags: ['test'],
        category: 'testing',
      };

      const prompt = await service.createPrompt(request);
      const storedData = mockStorage.getData();

      expect(storedData[prompt.id]).toEqual(prompt);
    });
  });

  describe('getPrompt', () => {
    it('should return prompt by ID and increment usage', async () => {
      const testPrompt: Prompt = {
        id: '123',
        title: 'Test Prompt',
        content: 'Content',
        tags: ['test'],
        category: 'testing',
        metadata: {
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          version: '1.0.0',
          usage: 5,
        },
      };

      mockStorage.setData({ '123': testPrompt });
      await service.initialize(); // Reload data

      const result = await service.getPrompt('123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('123');
      expect(result!.metadata.usage).toBe(6); // Should be incremented

      // Check that storage was updated
      const storedData = mockStorage.getData();
      expect(storedData['123']!.metadata.usage).toBe(6);
    });

    it('should return null for non-existent prompt', async () => {
      await service.initialize();
      
      const result = await service.getPrompt('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updatePrompt', () => {
    let existingPrompt: Prompt;

    beforeEach(() => {
      existingPrompt = {
        id: '123',
        title: 'Original Title',
        content: 'Original Content',
        tags: ['original'],
        category: 'original',
        metadata: {
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          version: '1.0.0',
          usage: 0,
        },
      };

      mockStorage.setData({ '123': existingPrompt });
    });

    it('should update prompt fields', async () => {
      await service.initialize();

      const updateRequest: UpdatePromptRequest = {
        title: 'Updated Title',
        content: 'Updated Content',
        tags: ['updated', 'new'],
      };

      const result = await service.updatePrompt('123', updateRequest);

      expect(result).toBeDefined();
      expect(result!.title).toBe('Updated Title');
      expect(result!.content).toBe('Updated Content');
      expect(result!.tags).toEqual(['updated', 'new']);
      expect(result!.category).toBe('original'); // Should remain unchanged
      expect(result!.metadata.version).toBe('1.0.1'); // Should be incremented
      expect(result!.metadata.updatedAt).not.toBe(existingPrompt.metadata.updatedAt);
    });

    it('should return null for non-existent prompt', async () => {
      await service.initialize();

      const updateRequest: UpdatePromptRequest = {
        title: 'Updated Title',
      };

      const result = await service.updatePrompt('non-existent', updateRequest);
      expect(result).toBeNull();
    });

    it('should remove duplicate tags in update', async () => {
      await service.initialize();

      const updateRequest: UpdatePromptRequest = {
        tags: ['tag1', 'tag2', 'tag1', 'tag3', 'tag2'],
      };

      const result = await service.updatePrompt('123', updateRequest);

      expect(result!.tags).toHaveLength(3);
      expect(result!.tags).toContain('tag1');
      expect(result!.tags).toContain('tag2');
      expect(result!.tags).toContain('tag3');
    });
  });

  describe('deletePrompt', () => {
    it('should delete existing prompt', async () => {
      const testPrompt: Prompt = {
        id: '123',
        title: 'Test Prompt',
        content: 'Content',
        tags: ['test'],
        category: 'testing',
        metadata: {
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          version: '1.0.0',
          usage: 0,
        },
      };

      mockStorage.setData({ '123': testPrompt });
      await service.initialize();

      const result = await service.deletePrompt('123');

      expect(result).toBe(true);

      const storedData = mockStorage.getData();
      expect(storedData['123']).toBeUndefined();
    });

    it('should return false for non-existent prompt', async () => {
      await service.initialize();
      
      const result = await service.deletePrompt('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('listPrompts', () => {
    beforeEach(async () => {
      const testPrompts: Record<string, Prompt> = {
        '1': {
          id: '1',
          title: 'JavaScript Prompt',
          content: 'JS content',
          tags: ['javascript', 'programming'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 10,
          },
        },
        '2': {
          id: '2',
          title: 'Python Prompt',
          content: 'Python content',
          tags: ['python', 'programming'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-02T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z',
            version: '1.0.0',
            usage: 5,
          },
        },
        '3': {
          id: '3',
          title: 'Writing Prompt',
          content: 'Writing content',
          tags: ['creative', 'writing'],
          category: 'creative',
          metadata: {
            createdAt: '2023-01-03T00:00:00.000Z',
            updatedAt: '2023-01-03T00:00:00.000Z',
            version: '1.0.0',
            usage: 15,
          },
        },
      };

      mockStorage.setData(testPrompts);
      await service.initialize();
    });

    it('should return all prompts when no filters applied', async () => {
      const result = await service.listPrompts();

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should filter by category', async () => {
      const result = await service.listPrompts({ category: 'coding' });

      expect(result.items).toHaveLength(2);
      expect(result.items.every(p => p.category === 'coding')).toBe(true);
    });

    it('should filter by tags', async () => {
      const result = await service.listPrompts({ tags: ['programming'] });

      expect(result.items).toHaveLength(2);
      expect(result.items.every(p => p.tags.includes('programming'))).toBe(true);
    });

    it('should filter by title', async () => {
      const result = await service.listPrompts({ title: 'JavaScript' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.title).toBe('JavaScript Prompt');
    });

    it('should apply pagination', async () => {
      const result = await service.listPrompts({ limit: 2, offset: 1 });

      expect(result.items).toHaveLength(2);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(1);
      expect(result.total).toBe(3);
    });

    it('should sort by usage descending', async () => {
      const result = await service.listPrompts();

      expect(result.items[0]!.metadata.usage).toBe(15); // Writing Prompt
      expect(result.items[1]!.metadata.usage).toBe(10); // JavaScript Prompt
      expect(result.items[2]!.metadata.usage).toBe(5);  // Python Prompt
    });
  });

  describe('searchPrompts', () => {
    beforeEach(async () => {
      const testPrompts: Record<string, Prompt> = {
        '1': {
          id: '1',
          title: 'JavaScript Tutorial',
          content: 'Learn JavaScript programming basics',
          description: 'A comprehensive guide to JS',
          tags: ['javascript', 'programming', 'tutorial'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 10,
          },
        },
        '2': {
          id: '2',
          title: 'Python Basics',
          content: 'Python programming fundamentals',
          tags: ['python', 'programming'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-02T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z',
            version: '1.0.0',
            usage: 5,
          },
        },
        '3': {
          id: '3',
          title: 'Creative Writing',
          content: 'Tips for creative writing and storytelling',
          tags: ['creative', 'writing'],
          category: 'creative',
          metadata: {
            createdAt: '2023-01-03T00:00:00.000Z',
            updatedAt: '2023-01-03T00:00:00.000Z',
            version: '1.0.0',
            usage: 15,
          },
        },
      };

      mockStorage.setData(testPrompts);
      await service.initialize();
    });

    it('should search by title', async () => {
      const result = await service.searchPrompts('JavaScript');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.title).toBe('JavaScript Tutorial');
    });

    it('should search by content', async () => {
      const result = await service.searchPrompts('programming');

      expect(result.items).toHaveLength(2);
      expect(result.items.some(p => p.title.includes('JavaScript'))).toBe(true);
      expect(result.items.some(p => p.title.includes('Python'))).toBe(true);
    });

    it('should search by tags', async () => {
      const result = await service.searchPrompts('tutorial');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.tags).toContain('tutorial');
    });

    it('should search by description', async () => {
      const result = await service.searchPrompts('comprehensive');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.description).toContain('comprehensive');
    });

    it('should apply additional filters', async () => {
      const result = await service.searchPrompts('programming', { category: 'coding' });

      expect(result.items).toHaveLength(2);
      expect(result.items.every(p => p.category === 'coding')).toBe(true);
    });

    it('should sort by relevance score', async () => {
      const result = await service.searchPrompts('JavaScript');

      // JavaScript Tutorial should rank higher due to title match
      expect(result.items[0]!.title).toBe('JavaScript Tutorial');
    });
  });

  describe('getCategories', () => {
    it('should return sorted unique categories', async () => {
      const testPrompts: Record<string, Prompt> = {
        '1': {
          id: '1',
          title: 'Prompt 1',
          content: 'Content',
          tags: ['test'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
        '2': {
          id: '2',
          title: 'Prompt 2',
          content: 'Content',
          tags: ['test'],
          category: 'creative',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
        '3': {
          id: '3',
          title: 'Prompt 3',
          content: 'Content',
          tags: ['test'],
          category: 'coding', // Duplicate
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
      };

      mockStorage.setData(testPrompts);
      await service.initialize();

      const categories = await service.getCategories();

      expect(categories).toEqual(['coding', 'creative']);
    });
  });

  describe('getTags', () => {
    it('should return sorted unique tags', async () => {
      const testPrompts: Record<string, Prompt> = {
        '1': {
          id: '1',
          title: 'Prompt 1',
          content: 'Content',
          tags: ['javascript', 'programming'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
        '2': {
          id: '2',
          title: 'Prompt 2',
          content: 'Content',
          tags: ['creative', 'writing', 'javascript'], // Duplicate javascript
          category: 'creative',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
      };

      mockStorage.setData(testPrompts);
      await service.initialize();

      const tags = await service.getTags();

      expect(tags).toEqual(['creative', 'javascript', 'programming', 'writing']);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const testPrompts: Record<string, Prompt> = {
        '1': {
          id: '1',
          title: 'High Usage Prompt',
          content: 'Content',
          tags: ['tag1', 'tag2'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 100,
          },
        },
        '2': {
          id: '2',
          title: 'Medium Usage Prompt',
          content: 'Content',
          tags: ['tag2', 'tag3'],
          category: 'creative',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 50,
          },
        },
        '3': {
          id: '3',
          title: 'Low Usage Prompt',
          content: 'Content',
          tags: ['tag1', 'tag3'],
          category: 'coding',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 10,
          },
        },
      };

      mockStorage.setData(testPrompts);
      await service.initialize();

      const stats = await service.getStats();

      expect(stats.totalPrompts).toBe(3);
      expect(stats.totalCategories).toBe(2);
      expect(stats.totalTags).toBe(3);
      expect(stats.mostUsedPrompts).toHaveLength(3);
      expect(stats.mostUsedPrompts[0]!.usage).toBe(100);
      expect(stats.mostUsedPrompts[0]!.title).toBe('High Usage Prompt');
    });
  });
});