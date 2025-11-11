/**
 * POST /api/create-ui route
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createUiSchema } from '../utils/validation.js';
import { getUiProvider } from '../services/providers/ui-provider-factory.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';

const createUi = new Hono();

/**
 * Create a new UI component
 */
createUi.post(
  '/',
  zValidator('json', createUiSchema),
  async (c) => {
    const request = c.req.valid('json');

    logger.info('Create UI request received', {
      searchQuery: request.searchQuery,
      file: request.absolutePathToCurrentFile,
    });

    try {
      const provider = getUiProvider();
      const providerResponse = await provider.createUi(request);

      const response: ApiResponse<{ text: string; previewUrl?: string; provider: string }> = {
        success: true,
        data: {
          text: providerResponse.text,
          previewUrl: providerResponse.previewUrl,
          provider: providerResponse.provider,
        },
        timestamp: new Date().toISOString(),
      };

      return c.json(response);
    } catch (error) {
      logger.error('Create UI request failed', error);

      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
        return c.json(response, error.statusCode as any);
      }

      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500 as any);
    }
  }
);

export default createUi;
