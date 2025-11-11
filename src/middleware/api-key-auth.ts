/**
 * API Key Authentication Middleware
 * Supports both header-based and query parameter-based API key authentication
 */

import { Context, Next } from 'hono';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { AuthContext } from '../types/index.js';

const API_KEY_HEADER = 'x-api-key';
const API_KEY_QUERY = 'api_key';

export interface ApiKeyAuthConfig {
  apiKeys: string[];
  headerName?: string;
  queryParamName?: string;
}

/**
 * Create API key authentication middleware
 */
export function createApiKeyAuth(config: ApiKeyAuthConfig) {
  const headerName = config.headerName || API_KEY_HEADER;
  const queryParamName = config.queryParamName || API_KEY_QUERY;

  return async (c: Context, next: Next) => {
    // Try to extract API key from header
    let apiKey = c.req.header(headerName);

    // If not in header, try query parameter
    if (!apiKey) {
      apiKey = c.req.query(queryParamName);
    }

    // If no API key provided
    if (!apiKey) {
      logger.warn('API key authentication failed: No API key provided', {
        path: c.req.path,
        method: c.req.method,
      });
      throw new AuthenticationError('API key is required. Provide it via header or query parameter.');
    }

    // Validate API key
    const isValid = config.apiKeys.includes(apiKey);

    if (!isValid) {
      logger.warn('API key authentication failed: Invalid API key', {
        path: c.req.path,
        method: c.req.method,
      });
      throw new AuthenticationError('Invalid API key');
    }

    // Set auth context
    const authContext: AuthContext = {
      method: 'api-key',
      user: `api-key-${apiKey.substring(0, 8)}...`,
    };

    c.set('auth', authContext);

    logger.debug('API key authentication successful', {
      path: c.req.path,
      method: c.req.method,
      user: authContext.user,
    });

    await next();
  };
}
