import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      const response: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: errorMessage,
      };

      res.status(400).json(response);
      return;
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      const response: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: errorMessage,
      };

      res.status(400).json(response);
      return;
    }

    req.params = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Handle comma-separated tags in query parameters
    if (req.query.tags && typeof req.query.tags === 'string') {
      req.query.tags = req.query.tags.split(',').map(tag => tag.trim());
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      const response: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: errorMessage,
      };

      res.status(400).json(response);
      return;
    }

    req.query = value;
    next();
  };
};