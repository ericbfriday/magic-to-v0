/**
 * Main Hono.js HTTP server setup
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serve } from '@hono/node-server';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import type { ApiResponse } from '../types/index.js';

// Import routes
import health from '../routes/health.js';
import createUi from '../routes/create-ui.js';
import fetchUi from '../routes/fetch-ui.js';
import refineUi from '../routes/refine-ui.js';
import logoSearch from '../routes/logo-search.js';

/**
 * Create and configure Hono app
 */
export function createApp(): Hono {
  const app = new Hono();

  // Global middleware
  app.use('*', honoLogger());
  app.use('*', prettyJSON());

  // CORS middleware
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposeHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 86400,
      credentials: true,
    })
  );

  // Authentication middleware (if enabled)
  const authMiddleware = createAuthMiddleware();
  if (authMiddleware) {
    app.use('/api/*', authMiddleware);
  }

  // Mount routes
  app.route('/health', health);
  app.route('/api/create-ui', createUi);
  app.route('/api/fetch-ui', fetchUi);
  app.route('/api/refine-ui', refineUi);
  app.route('/api/logo-search', logoSearch);

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      name: 'Magic MCP Server',
      version: '1.0.0',
      mode: config.mode,
      endpoints: {
        health: '/health',
        healthDetailed: '/health/detailed',
        createUi: 'POST /api/create-ui',
        fetchUi: 'POST /api/fetch-ui',
        refineUi: 'POST /api/refine-ui',
        logoSearch: 'POST /api/logo-search',
      },
      documentation: 'https://github.com/yourusername/magic-mcp-server',
    });
  });

  // 404 handler
  app.notFound((c) => {
    const response: ApiResponse = {
      success: false,
      error: 'Not found',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 404);
  });

  // Global error handler
  app.onError((error, c) => {
    logger.error('Request error', error, {
      path: c.req.path,
      method: c.req.method,
    });

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
  });

  return app;
}

/**
 * Start HTTP server
 */
export async function startHttpServer(): Promise<void> {
  const app = createApp();

  logger.info('Starting HTTP server', {
    host: config.host,
    port: config.port,
    mode: config.mode,
    authEnabled: config.auth.enabled,
  });

  serve(
    {
      fetch: app.fetch,
      port: config.port,
      hostname: config.host,
    },
    (info) => {
      logger.info('HTTP server listening', {
        url: `http://${info.address}:${info.port}`,
        address: info.address,
        port: info.port,
      });
    }
  );
}
