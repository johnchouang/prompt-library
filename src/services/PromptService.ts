import { randomUUID } from 'crypto';
import { 
  Prompt, 
  CreatePromptRequest, 
  UpdatePromptRequest, 
  SearchFilters, 
  PaginatedResponse,
  StorageProvider 
} from '../types';

export class PromptService {
  private prompts: Record<string, Prompt> = {};
  private initialized = false;

  constructor(private storage: StorageProvider) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.prompts = await this.storage.load();
    this.initialized = true;
  }

  async createPrompt(request: CreatePromptRequest): Promise<Prompt> {
    await this.ensureInitialized();

    const id = randomUUID();
    const now = new Date().toISOString();

    const prompt: Prompt = {
      id,
      title: request.title,
      content: request.content,
      description: request.description,
      tags: [...new Set(request.tags)], // Remove duplicates
      category: request.category,
      variables: request.variables || [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        ...(request.author && { author: request.author }),
        usage: 0,
      },
    };

    this.prompts[id] = prompt;
    await this.storage.save(this.prompts);

    return prompt;
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    await this.ensureInitialized();
    
    const prompt = this.prompts[id];
    if (prompt) {
      // Increment usage counter
      prompt.metadata.usage = (prompt.metadata.usage || 0) + 1;
      await this.storage.save(this.prompts);
    }
    
    return prompt || null;
  }

  async updatePrompt(id: string, request: UpdatePromptRequest): Promise<Prompt | null> {
    await this.ensureInitialized();

    const existingPrompt = this.prompts[id];
    if (!existingPrompt) {
      return null;
    }

    const updatedPrompt: Prompt = {
      ...existingPrompt,
      title: request.title ?? existingPrompt.title,
      content: request.content ?? existingPrompt.content,
      ...(request.description !== undefined && { description: request.description }),
      tags: request.tags ? [...new Set(request.tags)] : existingPrompt.tags,
      category: request.category ?? existingPrompt.category,
      ...(request.variables !== undefined && { variables: request.variables }),
      metadata: {
        ...existingPrompt.metadata,
        updatedAt: new Date().toISOString(),
        version: this.incrementVersion(existingPrompt.metadata.version),
      },
    };

    this.prompts[id] = updatedPrompt;
    await this.storage.save(this.prompts);

    return updatedPrompt;
  }

  async deletePrompt(id: string): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.prompts[id]) {
      return false;
    }

    delete this.prompts[id];
    await this.storage.save(this.prompts);

    return true;
  }

  async listPrompts(filters: SearchFilters = {}): Promise<PaginatedResponse<Prompt>> {
    await this.ensureInitialized();

    let filteredPrompts = Object.values(this.prompts);

    // Apply filters
    if (filters.category) {
      filteredPrompts = filteredPrompts.filter(p => 
        p.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(p =>
        filters.tags!.some(tag => 
          p.tags.some(pTag => pTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    if (filters.title) {
      filteredPrompts = filteredPrompts.filter(p =>
        p.title.toLowerCase().includes(filters.title!.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(filters.title!.toLowerCase()))
      );
    }

    // Sort by usage and then by updated date
    filteredPrompts.sort((a, b) => {
      const usageDiff = (b.metadata.usage || 0) - (a.metadata.usage || 0);
      if (usageDiff !== 0) return usageDiff;
      return new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime();
    });

    const total = filteredPrompts.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const paginatedPrompts = filteredPrompts.slice(offset, offset + limit);

    return {
      items: paginatedPrompts,
      total,
      limit,
      offset,
    };
  }

  async searchPrompts(query: string, filters: SearchFilters = {}): Promise<PaginatedResponse<Prompt>> {
    await this.ensureInitialized();

    const searchFilters: SearchFilters = {
      ...filters,
      title: query, // Use title filter for general search
    };

    // Also search in content and tags
    let filteredPrompts = Object.values(this.prompts).filter(prompt => {
      const queryLower = query.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(queryLower) ||
        (prompt.description && prompt.description.toLowerCase().includes(queryLower)) ||
        prompt.content.toLowerCase().includes(queryLower) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        prompt.category.toLowerCase().includes(queryLower)
      );
    });

    // Apply additional filters
    if (filters.category) {
      filteredPrompts = filteredPrompts.filter(p => 
        p.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(p =>
        filters.tags!.some(tag => 
          p.tags.some(pTag => pTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    // Sort by relevance (simple scoring based on matches)
    filteredPrompts.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // Secondary sort by usage
      return (b.metadata.usage || 0) - (a.metadata.usage || 0);
    });

    const total = filteredPrompts.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const paginatedPrompts = filteredPrompts.slice(offset, offset + limit);

    return {
      items: paginatedPrompts,
      total,
      limit,
      offset,
    };
  }

  async getCategories(): Promise<string[]> {
    await this.ensureInitialized();
    
    const categories = new Set(Object.values(this.prompts).map(p => p.category));
    return Array.from(categories).sort();
  }

  async getTags(): Promise<string[]> {
    await this.ensureInitialized();
    
    const allTags = Object.values(this.prompts).flatMap(p => p.tags);
    const uniqueTags = new Set(allTags);
    return Array.from(uniqueTags).sort();
  }

  async getStats(): Promise<{
    totalPrompts: number;
    totalCategories: number;
    totalTags: number;
    mostUsedPrompts: Array<{ id: string; title: string; usage: number }>;
  }> {
    await this.ensureInitialized();

    const prompts = Object.values(this.prompts);
    const categories = await this.getCategories();
    const tags = await this.getTags();

    const mostUsedPrompts = prompts
      .sort((a, b) => (b.metadata.usage || 0) - (a.metadata.usage || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        usage: p.metadata.usage || 0,
      }));

    return {
      totalPrompts: prompts.length,
      totalCategories: categories.length,
      totalTags: tags.length,
      mostUsedPrompts,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0', 10) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private calculateRelevanceScore(prompt: Prompt, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title matches are most important
    if (prompt.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Tag matches are also important
    if (prompt.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      score += 5;
    }

    // Category matches
    if (prompt.category.toLowerCase().includes(queryLower)) {
      score += 3;
    }

    // Description matches
    if (prompt.description && prompt.description.toLowerCase().includes(queryLower)) {
      score += 2;
    }

    // Content matches (least important for sorting, but still relevant)
    if (prompt.content.toLowerCase().includes(queryLower)) {
      score += 1;
    }

    return score;
  }
}