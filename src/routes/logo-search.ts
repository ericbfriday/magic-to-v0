/**
 * POST /api/logo-search route
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { logoSearchSchema } from '../utils/validation.js';
import { logoService } from '../services/logo-service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';

const logoSearch = new Hono();

/**
 * Search for logos
 */
logoSearch.post(
  '/',
  zValidator('json', logoSearchSchema),
  async (c) => {
    const request = c.req.valid('json');

    logger.info('Logo search request received', {
      queries: request.queries,
      format: request.format,
    });

    try {
      const result = await logoService.searchLogos(request);

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      return c.json(response);
    } catch (error) {
      logger.error('Logo search request failed', error);

      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
        return c.json(response, error.statusCode);
      }

      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }
  }
);

export default logoSearch;
