import { Router } from 'express';
import { PromptController } from '../controllers/PromptController';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createPromptSchema,
  updatePromptSchema,
  idParamSchema,
  listPromptsQuerySchema,
  searchPromptsQuerySchema,
} from '../validation/schemas';

export const createPromptRoutes = (promptController: PromptController): Router => {
  const router = Router();

  // Create a new prompt
  router.post(
    '/',
    validateBody(createPromptSchema),
    promptController.createPrompt.bind(promptController)
  );

  // Get all prompts with optional filtering
  router.get(
    '/',
    validateQuery(listPromptsQuerySchema),
    promptController.listPrompts.bind(promptController)
  );

  // Search prompts
  router.get(
    '/search',
    validateQuery(searchPromptsQuerySchema),
    promptController.searchPrompts.bind(promptController)
  );

  // Get available categories
  router.get(
    '/categories',
    promptController.getCategories.bind(promptController)
  );

  // Get available tags
  router.get(
    '/tags',
    promptController.getTags.bind(promptController)
  );

  // Get usage statistics
  router.get(
    '/stats',
    promptController.getStats.bind(promptController)
  );

  // Get a specific prompt by ID
  router.get(
    '/:id',
    validateParams(idParamSchema),
    promptController.getPrompt.bind(promptController)
  );

  // Update a specific prompt
  router.put(
    '/:id',
    validateParams(idParamSchema),
    validateBody(updatePromptSchema),
    promptController.updatePrompt.bind(promptController)
  );

  // Delete a specific prompt
  router.delete(
    '/:id',
    validateParams(idParamSchema),
    promptController.deletePrompt.bind(promptController)
  );

  return router;
};