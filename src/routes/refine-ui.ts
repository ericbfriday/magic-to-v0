/**
 * POST /api/refine-ui route
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { refineUiSchema } from '../utils/validation.js';
import { getUiProvider } from '../services/providers/ui-provider-factory.js';
import { logger } from '../utils/logger.js';
import { AppError, ValidationError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';
import { promises as fs } from 'fs';

const refineUi = new Hono();

// Extended schema for API that includes fileContent and sessionId
const refineUiApiSchema = refineUiSchema.extend({
  fileContent: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * Refine an existing UI component
 */
refineUi.post(
  '/',
  zValidator('json', refineUiApiSchema),
  async (c) => {
    const request = c.req.valid('json');

    logger.info('Refine UI request received', {
      file: request.absolutePathToRefiningFile,
    });

    try {
      // Get file content either from request or by reading file
      let fileContent = request.fileContent;

      if (!fileContent) {
        try {
          fileContent = await fs.readFile(
            request.absolutePathToRefiningFile,
            'utf-8'
          );
        } catch (error) {
          logger.error('Failed to read file for refinement', error, {
            file: request.absolutePathToRefiningFile,
          });
          throw new ValidationError(
            `Failed to read file: ${request.absolutePathToRefiningFile}`,
            { originalError: error instanceof Error ? error.message : 'Unknown error' }
          );
        }
      }

      const provider = getUiProvider();
      const providerResponse = await provider.refineUi(
        {
          userMessage: request.userMessage,
          absolutePathToRefiningFile: request.absolutePathToRefiningFile,
          context: request.context,
        },
        fileContent,
        request.sessionId
      );

      const response: ApiResponse<{
        text: string;
        previewUrl?: string;
        sessionId?: string;
        provider: string;
      }> = {
        success: true,
        data: {
          text: providerResponse.text,
          previewUrl: providerResponse.previewUrl,
          sessionId: providerResponse.sessionId,
          provider: providerResponse.provider,
        },
        timestamp: new Date().toISOString(),
      };

      return c.json(response);
    } catch (error) {
      logger.error('Refine UI request failed', error);

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

export default refineUi;
