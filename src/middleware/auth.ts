/**
 * Main authentication middleware orchestrator
 * Supports multiple authentication methods with fallback
 */

import { Context, Next } from 'hono';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { AuthenticationError } from '../utils/errors.js';
import { createApiKeyAuth } from './api-key-auth.js';
import { createBasicAuth } from './basic-auth.js';
import { createOIDCAuth } from './oidc-auth.js';

type AuthMiddleware = (c: Context, next: Next) => Promise<void>;

/**
 * Create a composed auth middleware that tries multiple methods
 */
function composeAuthMiddleware(middlewares: AuthMiddleware[]) {
  return async (c: Context, next: Next) => {
    const errors: Error[] = [];

    for (const middleware of middlewares) {
      try {
        await middleware(c, async () => {});
        // If middleware succeeds, proceed to next handler
        await next();
        return;
      } catch (error) {
        // Collect errors and try next method
        if (error instanceof Error) {
          errors.push(error);
        }
      }
    }

    // All methods failed
    logger.warn('All authentication methods failed', {
      path: c.req.path,
      method: c.req.method,
      attemptedMethods: config.auth.methods,
      errors: errors.map(e => e.message),
    });

    throw new AuthenticationError(
      `Authentication failed. Supported methods: ${config.auth.methods.join(', ')}`
    );
  };
}

/**
 * Create authentication middleware based on configuration
 */
export function createAuthMiddleware(): AuthMiddleware | null {
  if (!config.auth.enabled) {
    logger.info('Authentication disabled');
    return null;
  }

  const middlewares: AuthMiddleware[] = [];

  // Add API key auth if configured
  if (config.auth.methods.includes('api-key') && config.auth.apiKeys && config.auth.apiKeys.length > 0) {
    logger.info('API key authentication enabled', {
      keyCount: config.auth.apiKeys.length,
    });
    middlewares.push(createApiKeyAuth({ apiKeys: config.auth.apiKeys }));
  }

  // Add OIDC auth if configured
  if (config.auth.methods.includes('oidc') && config.auth.oidc) {
    logger.info('OIDC authentication enabled', {
      issuer: config.auth.oidc.issuer,
      clientId: config.auth.oidc.clientId,
    });
    middlewares.push(createOIDCAuth(config.auth.oidc));
  }

  // Add Basic auth if configured
  if (config.auth.methods.includes('basic') && config.auth.basicAuth) {
    logger.info('Basic authentication enabled', {
      userCount: Object.keys(config.auth.basicAuth.users).length,
    });
    middlewares.push(createBasicAuth({ users: config.auth.basicAuth.users }));
  }

  if (middlewares.length === 0) {
    logger.warn('Authentication enabled but no methods configured');
    return null;
  }

  logger.info('Authentication configured', {
    methods: config.auth.methods,
  });

  return composeAuthMiddleware(middlewares);
}

/**
 * Get authentication context from request
 */
export function getAuthContext(c: Context) {
  return c.get('auth');
}
