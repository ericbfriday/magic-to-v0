/**
 * UI Provider Interface
 *
 * Defines the contract for UI component generation providers.
 * Supports multiple implementations (21st.dev Magic, v0.dev, etc.)
 */

import { CreateUiRequest, FetchUiRequest, RefineUiRequest } from '../../types/index.js';

/**
 * Unified response format for all UI providers
 */
export interface UiProviderResponse {
  /**
   * Formatted text response for MCP tools or HTTP clients
   * Contains component code and instructions
   */
  text: string;

  /**
   * Optional preview URL (v0.dev provides this)
   */
  previewUrl?: string;

  /**
   * Array of generated files with names and content
   */
  files?: Array<{
    name: string;
    content: string;
    path?: string;
  }>;

  /**
   * Session ID for maintaining conversation continuity
   * Used in refinement operations
   */
  sessionId?: string;

  /**
   * Additional provider-specific metadata
   */
  metadata?: Record<string, any>;

  /**
   * Provider name that generated this response
   */
  provider: string;
}

/**
 * UI Provider Interface
 *
 * All UI component providers must implement this interface
 */
export interface UiProvider {
  /**
   * Provider name (e.g., 'magic', 'v0')
   */
  readonly name: string;

  /**
   * Create a new UI component from a description
   *
   * @param request Component creation request
   * @returns Promise resolving to provider response
   */
  createUi(request: CreateUiRequest): Promise<UiProviderResponse>;

  /**
   * Fetch existing UI component examples/inspiration
   *
   * @param request Component fetch request
   * @returns Promise resolving to provider response
   */
  fetchUi(request: FetchUiRequest): Promise<UiProviderResponse>;

  /**
   * Refine an existing UI component
   *
   * @param request Refinement request
   * @param fileContent Current file content to refine
   * @param sessionId Optional session ID for continuity
   * @returns Promise resolving to provider response
   */
  refineUi(
    request: RefineUiRequest,
    fileContent: string,
    sessionId?: string
  ): Promise<UiProviderResponse>;

  /**
   * Check if provider is properly configured and ready to use
   *
   * @returns Promise resolving to true if ready, false otherwise
   */
  isReady(): Promise<boolean>;

  /**
   * Get provider configuration status and health information
   */
  getStatus(): Promise<{
    available: boolean;
    configured: boolean;
    message?: string;
  }>;
}

/**
 * Provider type discriminator
 */
export type UiProviderType = 'magic' | 'v0';

/**
 * Provider factory configuration
 */
export interface ProviderFactoryConfig {
  /**
   * Active provider type
   */
  provider: UiProviderType;

  /**
   * 21st.dev Magic UI configuration
   */
  magic?: {
    apiKey: string;
    baseUrl: string;
    callbackServerPort: number;
  };

  /**
   * v0.dev configuration
   */
  v0?: {
    apiKey: string;
  };
}
