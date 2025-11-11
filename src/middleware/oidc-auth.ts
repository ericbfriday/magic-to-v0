/**
 * OIDC (OpenID Connect) / OAuth 2.0 Authentication Middleware
 */

import { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { OIDCConfig, AuthContext } from '../types/index.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * OIDC Authentication Middleware
 */
export class OIDCAuth {
  private config: OIDCConfig;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: OIDCConfig) {
    this.config = config;

    // Initialize JWKS client if jwksUri is provided
    if (config.jwksUri) {
      this.jwks = createRemoteJWKSet(new URL(config.jwksUri));
    }
  }

  /**
   * Discover OIDC configuration from issuer
   */
  async discoverConfig(): Promise<void> {
    try {
      const wellKnownUrl = `${this.config.issuer}/.well-known/openid-configuration`;
      logger.debug('Discovering OIDC configuration', { wellKnownUrl });

      const response = await fetch(wellKnownUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch OIDC configuration: ${response.status}`);
      }

      const config = await response.json() as any;

      if (config.jwks_uri && !this.config.jwksUri) {
        this.config.jwksUri = config.jwks_uri;
        this.jwks = createRemoteJWKSet(new URL(config.jwks_uri));
        logger.info('OIDC JWKS URI discovered', { jwksUri: config.jwks_uri });
      }
    } catch (error) {
      logger.error('Failed to discover OIDC configuration', error);
      throw new Error('Failed to initialize OIDC authentication');
    }
  }

  /**
   * Extract bearer token from Authorization header
   */
  private extractBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
      return null;
    }
    return authHeader.substring(BEARER_PREFIX.length);
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<JWTPayload> {
    if (!this.jwks) {
      await this.discoverConfig();
      if (!this.jwks) {
        throw new Error('JWKS not configured');
      }
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      return payload;
    } catch (error) {
      logger.warn('JWT verification failed', { error });
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Middleware function
   */
  middleware() {
    return async (c: Context, next: Next) => {
      const authHeader = c.req.header('Authorization');
      const token = this.extractBearerToken(authHeader);

      if (!token) {
        logger.warn('OIDC auth failed: No bearer token provided', {
          path: c.req.path,
          method: c.req.method,
        });
        throw new AuthenticationError('Bearer token required');
      }

      try {
        const payload = await this.verifyToken(token);

        // Extract user information from token
        const user = payload.sub || payload.email || payload.preferred_username || 'unknown';

        // Set auth context
        const authContext: AuthContext = {
          method: 'oidc',
          user: user as string,
          claims: payload,
        };

        c.set('auth', authContext);

        logger.debug('OIDC authentication successful', {
          path: c.req.path,
          method: c.req.method,
          user,
          issuer: payload.iss,
        });

        await next();
      } catch (error) {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        logger.error('OIDC authentication error', error);
        throw new AuthenticationError('Authentication failed');
      }
    };
  }
}

/**
 * Create OIDC authentication middleware
 */
export function createOIDCAuth(config: OIDCConfig) {
  const oidcAuth = new OIDCAuth(config);
  return oidcAuth.middleware();
}
