#!/usr/bin/env node

/**
 * Main entry point for Magic MCP Server
 * Supports dual-mode operation: HTTP (Hono.js) and STDIO (MCP)
 */

import { config, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { startHttpServer } from './server/hono-server.js';
import { startMCPServer } from './server/mcp-server.js';

/**
 * Main entry point
 */
async function main() {
  try {
    // Validate configuration
    validateConfig(config);

    logger.info('Magic MCP Server starting', {
      mode: config.mode,
      version: '1.0.0',
      node: process.version,
      platform: process.platform,
    });

    // Start server(s) based on mode
    switch (config.mode) {
      case 'http':
        logger.info('Starting in HTTP-only mode');
        await startHttpServer();
        break;

      case 'stdio':
        logger.info('Starting in STDIO-only mode');
        await startMCPServer();
        break;

      case 'dual':
        logger.info('Starting in dual mode (HTTP + STDIO)');
        // Start HTTP server in background
        startHttpServer().catch((error) => {
          logger.error('HTTP server failed', error);
        });
        // Start MCP server (blocks on STDIO)
        await startMCPServer();
        break;

      default:
        throw new Error(`Invalid server mode: ${config.mode}`);
    }
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', reason, { promise });
  process.exit(1);
});

// Start the server
main();
