/**
 * Type definitions for Magic MCP Server
 */

export interface Config {
  // Server configuration
  port: number;
  host: string;
  mode: 'stdio' | 'http' | 'dual';

  // API configuration
  apiKey?: string;
  baseUrl: string;

  // Authentication configuration
  auth: {
    enabled: boolean;
    methods: ('api-key' | 'oidc' | 'basic')[];
    apiKeys?: string[];
    oidc?: OIDCConfig;
    basicAuth?: BasicAuthConfig;
  };

  // Callback server configuration
  callbackServer: {
    startPort: number;
    timeout: number;
  };

  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
  };
}

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  audience?: string;
  jwksUri?: string;
}

export interface BasicAuthConfig {
  users: Record<string, string>; // username -> password hash
}

export interface CreateUiRequest {
  message: string;
  searchQuery: string;
  absolutePathToCurrentFile: string;
  absolutePathToProjectDirectory: string;
  standaloneRequestQuery: string;
}

export interface FetchUiRequest {
  message: string;
  searchQuery: string;
}

export interface RefineUiRequest {
  userMessage: string;
  absolutePathToRefiningFile: string;
  context: string;
}

export interface LogoSearchRequest {
  queries: string[];
  format: 'JSX' | 'TSX' | 'SVG';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface MCPToolResponse {
  content: Array<{ type: 'text'; text: string }>;
}

export interface SVGLogo {
  id?: number;
  title: string;
  category: string | string[];
  route: string | { dark: string; light: string };
  wordmark?: string | { dark: string; light: string };
  brandUrl?: string;
  url: string;
}

export interface CallbackResponse {
  data?: any;
  timedOut?: boolean;
}

export interface AuthContext {
  method: 'api-key' | 'oidc' | 'basic';
  user?: string;
  claims?: Record<string, any>;
}
