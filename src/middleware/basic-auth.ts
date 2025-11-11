/**
 * Basic HTTP Authentication Middleware
 */

import { Context, Next } from 'hono';
import { createHash } from 'crypto';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { AuthContext } from '../types/index.js';

export interface BasicAuthConfig {
  users: Record<string, string>; // username -> password hash (SHA-256)
  realm?: string;
}

/**
 * Hash password using SHA-256
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Parse Basic Auth header
 */
function parseBasicAuth(authHeader: string): { username: string; password: string } | null {
  const match = authHeader.match(/^Basic\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) return null;

    return {
      username: decoded.substring(0, colonIndex),
      password: decoded.substring(colonIndex + 1),
    };
  } catch {
    return null;
  }
}

/**
 * Create Basic authentication middleware
 */
export function createBasicAuth(config: BasicAuthConfig) {
  const realm = config.realm || 'Magic MCP Server';

  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      logger.warn('Basic auth failed: No Authorization header', {
        path: c.req.path,
        method: c.req.method,
      });
      c.header('WWW-Authenticate', `Basic realm="${realm}"`);
      throw new AuthenticationError('Basic authentication required');
    }

    const credentials = parseBasicAuth(authHeader);

    if (!credentials) {
      logger.warn('Basic auth failed: Invalid Authorization header format', {
        path: c.req.path,
        method: c.req.method,
      });
      c.header('WWW-Authenticate', `Basic realm="${realm}"`);
      throw new AuthenticationError('Invalid Basic authentication format');
    }

    const { username, password } = credentials;

    // Check if user exists
    const storedPasswordHash = config.users[username];
    if (!storedPasswordHash) {
      logger.warn('Basic auth failed: Unknown user', {
        path: c.req.path,
        method: c.req.method,
        username,
      });
      c.header('WWW-Authenticate', `Basic realm="${realm}"`);
      throw new AuthenticationError('Invalid username or password');
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (passwordHash !== storedPasswordHash) {
      logger.warn('Basic auth failed: Invalid password', {
        path: c.req.path,
        method: c.req.method,
        username,
      });
      c.header('WWW-Authenticate', `Basic realm="${realm}"`);
      throw new AuthenticationError('Invalid username or password');
    }

    // Set auth context
    const authContext: AuthContext = {
      method: 'basic',
      user: username,
    };

    c.set('auth', authContext);

    logger.debug('Basic authentication successful', {
      path: c.req.path,
      method: c.req.method,
      user: username,
    });

    await next();
  };
}
