export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  category: string;
  variables?: PromptVariable[];
  metadata: PromptMetadata;
}

export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: string | number | boolean | string[];
}

export interface PromptMetadata {
  createdAt: string;
  updatedAt: string;
  version: string;
  author?: string;
  usage?: number;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  description?: string;
  tags: string[];
  category: string;
  variables?: PromptVariable[];
  author?: string;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
  category?: string;
  variables?: PromptVariable[];
}

export interface SearchFilters {
  tags?: string[];
  category?: string;
  title?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface StorageProvider {
  load(): Promise<Record<string, Prompt>>;
  save(prompts: Record<string, Prompt>): Promise<void>;
  backup(): Promise<void>;
}