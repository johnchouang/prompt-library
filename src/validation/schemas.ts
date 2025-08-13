import Joi from 'joi';

export const promptVariableSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(1).max(500).required(),
  type: Joi.string().valid('string', 'number', 'boolean', 'array').required(),
  required: Joi.boolean().required(),
  defaultValue: Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
    Joi.array().items(Joi.string())
  ).optional(),
});

export const createPromptSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(50000).required(),
  description: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string().min(1).max(50)).min(0).max(20).required(),
  category: Joi.string().min(1).max(100).required(),
  variables: Joi.array().items(promptVariableSchema).max(20).optional(),
  author: Joi.string().max(100).optional(),
});

export const updatePromptSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  content: Joi.string().min(1).max(50000).optional(),
  description: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string().min(1).max(50)).min(0).max(20).optional(),
  category: Joi.string().min(1).max(100).optional(),
  variables: Joi.array().items(promptVariableSchema).max(20).optional(),
}).min(1); // At least one field must be provided

export const searchFiltersSchema = Joi.object({
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
  category: Joi.string().min(1).max(100).optional(),
  title: Joi.string().min(1).max(200).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

export const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(200).required(),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
  category: Joi.string().min(1).max(100).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

// Query parameter schemas for GET requests
export const listPromptsQuerySchema = Joi.object({
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  category: Joi.string().optional(),
  title: Joi.string().optional(),
  limit: Joi.string().pattern(/^\d+$/).optional(),
  offset: Joi.string().pattern(/^\d+$/).optional(),
});

export const searchPromptsQuerySchema = Joi.object({
  q: Joi.string().min(1).required(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  category: Joi.string().optional(),
  limit: Joi.string().pattern(/^\d+$/).optional(),
  offset: Joi.string().pattern(/^\d+$/).optional(),
});