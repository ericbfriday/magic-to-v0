/**
 * Configuration management for Magic MCP Server
 */

import { Config } from '../types/index.js';

/**
 * Parse command-line arguments for API key
 */
function parseArguments(): { apiKey?: string } {
  const config: { apiKey?: string } = {};

  process.argv.forEach((arg) => {
    const keyValuePatterns = [
      /^([A-Z_]+)=(.+)$/,       // API_KEY=value format
      /^--([A-Z_]+)=(.+)$/,     // --API_KEY=value format
      /^\/([A-Z_]+):(.+)$/,     // /API_KEY:value format (Windows style)
      /^-([A-Z_]+)[ =](.+)$/,   // -API_KEY value or -API_KEY=value format
    ];

    for (const pattern of keyValuePatterns) {
      const match = arg.match(pattern);
      if (match) {
        const [, key, value] = match;
        if (key === 'API_KEY') {
          config.apiKey = value.replaceAll('"', '').replaceAll("'", '');
          break;
        }
      }
    }
  });

  return config;
}

/**
 * Parse comma-separated list from environment variable
 */
function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse JSON from environment variable
 */
function parseJSON<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Load configuration from environment variables and command-line arguments
 */
export function loadConfig(): Config {
  const cliArgs = parseArguments();

  const providerType = (process.env.UI_PROVIDER || 'magic') as 'magic' | 'v0';
  const magicApiKey = cliArgs.apiKey || process.env.TWENTY_FIRST_API_KEY || process.env.API_KEY;
  const v0ApiKey = process.env.V0_API_KEY;

  return {
    // Server configuration
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    mode: (process.env.SERVER_MODE || 'dual') as 'stdio' | 'http' | 'dual',

    // API configuration (legacy - maintained for backward compatibility)
    apiKey: magicApiKey,
    baseUrl: process.env.BASE_URL ||
      (process.env.DEBUG === 'true' ? 'http://localhost:3005' : 'https://magic.21st.dev'),

    // UI Provider configuration
    uiProvider: {
      type: providerType,
      magic: magicApiKey ? {
        apiKey: magicApiKey,
        baseUrl: process.env.BASE_URL ||
          (process.env.DEBUG === 'true' ? 'http://localhost:3005' : 'https://magic.21st.dev'),
      } : undefined,
      v0: v0ApiKey ? {
        apiKey: v0ApiKey,
      } : undefined,
    },

    // Authentication configuration
    auth: {
      enabled: process.env.AUTH_ENABLED !== 'false',
      methods: parseList(process.env.AUTH_METHODS || 'api-key') as ('api-key' | 'oidc' | 'basic')[],
      apiKeys: parseList(process.env.AUTH_API_KEYS),
      oidc: process.env.OIDC_ISSUER ? {
        issuer: process.env.OIDC_ISSUER,
        clientId: process.env.OIDC_CLIENT_ID || '',
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        audience: process.env.OIDC_AUDIENCE,
        jwksUri: process.env.OIDC_JWKS_URI,
      } : undefined,
      basicAuth: process.env.BASIC_AUTH_USERS ? {
        users: parseJSON(process.env.BASIC_AUTH_USERS, {}),
      } : undefined,
    },

    // Callback server configuration
    callbackServer: {
      startPort: parseInt(process.env.CALLBACK_START_PORT || '9221', 10),
      timeout: parseInt(process.env.CALLBACK_TIMEOUT || '600000', 10),
    },

    // Logging configuration
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
      format: (process.env.LOG_FORMAT || 'json') as 'json' | 'pretty',
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): void {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  // Validate UI provider configuration
  if (config.uiProvider.type === 'magic' && !config.uiProvider.magic) {
    errors.push('Magic UI provider selected but not configured (missing API key)');
  }

  if (config.uiProvider.type === 'v0' && !config.uiProvider.v0) {
    errors.push('v0 provider selected but not configured (missing V0_API_KEY)');
  }

  if (config.auth.enabled) {
    if (config.auth.methods.length === 0) {
      errors.push('At least one authentication method must be enabled');
    }

    if (config.auth.methods.includes('api-key') && (!config.auth.apiKeys || config.auth.apiKeys.length === 0)) {
      errors.push('API key authentication enabled but no API keys configured');
    }

    if (config.auth.methods.includes('oidc') && !config.auth.oidc) {
      errors.push('OIDC authentication enabled but not configured');
    }

    if (config.auth.methods.includes('basic') && !config.auth.basicAuth) {
      errors.push('Basic authentication enabled but not configured');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export const config = loadConfig();
