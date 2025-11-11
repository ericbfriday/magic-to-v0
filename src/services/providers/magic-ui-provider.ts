/**
 * Magic UI Provider (21st.dev)
 *
 * Implementation of UiProvider interface for 21st.dev Magic UI API
 */

import open from 'open';
import { logger } from '../../utils/logger.js';
import { twentyFirstClient, HttpClient } from '../../utils/http-client.js';
import { CallbackServer } from '../callback-server.js';
import { ExternalServiceError, TimeoutError } from '../../utils/errors.js';
import { UiProvider, UiProviderResponse } from './ui-provider.interface.js';
import type { CreateUiRequest, FetchUiRequest, RefineUiRequest } from '../../types/index.js';

interface ApiTextResponse {
  text: string;
}

interface MagicProviderConfig {
  apiKey: string;
  baseUrl: string;
  callbackServerPort: number;
  callbackTimeout: number;
}

/**
 * Magic UI Provider - wraps 21st.dev Magic UI functionality
 */
export class MagicUiProvider implements UiProvider {
  readonly name = 'magic';
  private config: MagicProviderConfig;
  private httpClient: HttpClient;

  constructor(config: MagicProviderConfig) {
    this.config = config;
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    });
  }

  /**
   * Check if provider is ready to use
   */
  async isReady(): Promise<boolean> {
    return !!(this.config.apiKey && this.config.baseUrl);
  }

  /**
   * Get provider status
   */
  async getStatus(): Promise<{ available: boolean; configured: boolean; message?: string }> {
    const configured = !!(this.config.apiKey && this.config.baseUrl);

    if (!configured) {
      return {
        available: false,
        configured: false,
        message: 'Magic UI provider not configured (missing API key or base URL)',
      };
    }

    return {
      available: true,
      configured: true,
      message: 'Magic UI provider ready',
    };
  }

  /**
   * Create a new UI component by opening the browser and waiting for callback
   */
  async createUi(request: CreateUiRequest): Promise<UiProviderResponse> {
    logger.info('Magic UI: Creating component', {
      searchQuery: request.searchQuery,
      file: request.absolutePathToCurrentFile,
    });

    try {
      const server = new CallbackServer(this.config.callbackServerPort);
      const callbackPromise = server.waitForCallback({
        timeout: this.config.callbackTimeout,
        port: this.config.callbackServerPort,
      });
      const port = server.getPort();

      // Open browser with 21st.dev magic chat
      const url = `http://21st.dev/magic-chat?q=${encodeURIComponent(request.standaloneRequestQuery)}&mcp=true&port=${port}`;

      logger.debug('Magic UI: Opening browser', { url, port });
      await open(url);

      // Wait for callback data
      const result = await callbackPromise;

      if (result.timedOut) {
        throw new TimeoutError('Component creation timed out waiting for browser callback');
      }

      const componentData = result.data || '// No component data received. Please try again.';

      // Format response with shadcn/ui instructions
      const responseText = `${componentData}

## Shadcn/ui instructions
After you add the component, make sure to add the component to the project. If you can't resolve components from demo code,
Make sure to install shadcn/ui components from the demo code missing imports

Examples of importing shadcn/ui components:
if these imports can't be resolved:
\`\`\`tsx
import {
  Table
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
\`\`\`

then run this command:
\`\`\`bash
npx shadcn@latest add table textarea
\`\`\``;

      logger.info('Magic UI: Component created successfully', {
        componentDataLength: componentData.length,
      });

      return {
        text: responseText,
        provider: this.name,
        metadata: {
          source: '21st.dev',
          method: 'browser-callback',
        },
      };
    } catch (error) {
      logger.error('Magic UI: Failed to create component', error);
      throw error;
    }
  }

  /**
   * Fetch UI component inspiration from 21st.dev
   */
  async fetchUi(request: FetchUiRequest): Promise<UiProviderResponse> {
    logger.info('Magic UI: Fetching component inspiration', {
      searchQuery: request.searchQuery,
    });

    try {
      const response = await this.httpClient.post<ApiTextResponse>(
        '/api/fetch-ui',
        {
          message: request.message,
          searchQuery: request.searchQuery,
        }
      );

      logger.info('Magic UI: Component fetched successfully', {
        textLength: response.data.text.length,
      });

      return {
        text: response.data.text,
        provider: this.name,
        metadata: {
          source: '21st.dev',
          method: 'api',
        },
      };
    } catch (error) {
      logger.error('Magic UI: Failed to fetch component', error);
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to fetch UI component from 21st.dev',
        '21st.dev',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Refine an existing UI component
   */
  async refineUi(
    request: RefineUiRequest,
    fileContent: string,
    sessionId?: string
  ): Promise<UiProviderResponse> {
    logger.info('Magic UI: Refining component', {
      file: request.absolutePathToRefiningFile,
      contextLength: request.context.length,
      hasSessionId: !!sessionId,
    });

    try {
      const response = await this.httpClient.post<ApiTextResponse>(
        '/api/refine-ui',
        {
          userMessage: request.userMessage,
          fileContent,
          context: request.context,
        }
      );

      logger.info('Magic UI: Component refined successfully', {
        textLength: response.data.text.length,
      });

      return {
        text: response.data.text,
        provider: this.name,
        metadata: {
          source: '21st.dev',
          method: 'api',
        },
      };
    } catch (error) {
      logger.error('Magic UI: Failed to refine component', error);
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to refine UI component with 21st.dev',
        '21st.dev',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}
