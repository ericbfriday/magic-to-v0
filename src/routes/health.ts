/**
 * Health check endpoints
 */

import { Hono } from 'hono';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const health = new Hono();

/**
 * Basic health check
 */
health.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'magic-mcp-server',
  });
});

/**
 * Detailed health check with configuration info
 */
health.get('/detailed', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'magic-mcp-server',
    version: '1.0.0',
    config: {
      mode: config.mode,
      port: config.port,
      host: config.host,
      authEnabled: config.auth.enabled,
      authMethods: config.auth.methods,
      baseUrl: config.baseUrl,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * Readiness check
 */
health.get('/ready', (c) => {
  // Check if essential services are ready
  const isReady = true; // Add actual checks here if needed

  if (!isReady) {
    logger.warn('Service not ready');
    return c.json(
      {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      },
      503
    );
  }

  return c.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness check
 */
health.get('/live', (c) => {
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default health;
