/**
 * Service layer for UI component operations
 */

import open from 'open';
import { logger } from '../utils/logger.js';
import { twentyFirstClient } from '../utils/http-client.js';
import { CallbackServer } from './callback-server.js';
import { config } from '../utils/config.js';
import { ExternalServiceError, TimeoutError } from '../utils/errors.js';
import type { CreateUiRequest, FetchUiRequest, RefineUiRequest } from '../types/index.js';

interface ApiTextResponse {
  text: string;
}

export class UiService {
  /**
   * Create a new UI component by opening the browser and waiting for callback
   */
  async createUi(request: CreateUiRequest): Promise<string> {
    logger.info('Creating UI component', {
      searchQuery: request.searchQuery,
      file: request.absolutePathToCurrentFile,
    });

    try {
      const server = new CallbackServer(config.callbackServer.startPort);
      const callbackPromise = server.waitForCallback({
        timeout: config.callbackServer.timeout,
        port: config.callbackServer.startPort,
      });
      const port = server.getPort();

      // Open browser with 21st.dev magic chat
      const url = `http://21st.dev/magic-chat?q=${encodeURIComponent(request.standaloneRequestQuery)}&mcp=true&port=${port}`;

      logger.debug('Opening browser', { url, port });
      await open(url);

      // Wait for callback data
      const result = await callbackPromise;

      if (result.timedOut) {
        throw new TimeoutError('Component creation timed out waiting for browser callback');
      }

      const componentData = result.data || '// No component data received. Please try again.';

      // Format response with shadcn/ui instructions
      const responseToUser = `${componentData}

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

      logger.info('UI component created successfully', {
        componentDataLength: componentData.length,
      });

      return responseToUser;
    } catch (error) {
      logger.error('Failed to create UI component', error);
      throw error;
    }
  }

  /**
   * Fetch UI component inspiration from 21st.dev
   */
  async fetchUi(request: FetchUiRequest): Promise<string> {
    logger.info('Fetching UI component inspiration', {
      searchQuery: request.searchQuery,
    });

    try {
      const response = await twentyFirstClient.post<ApiTextResponse>(
        '/api/fetch-ui',
        {
          message: request.message,
          searchQuery: request.searchQuery,
        }
      );

      logger.info('UI component fetched successfully', {
        textLength: response.data.text.length,
      });

      return response.data.text;
    } catch (error) {
      logger.error('Failed to fetch UI component', error);
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
  async refineUi(request: RefineUiRequest, fileContent: string): Promise<string> {
    logger.info('Refining UI component', {
      file: request.absolutePathToRefiningFile,
      contextLength: request.context.length,
    });

    try {
      const response = await twentyFirstClient.post<ApiTextResponse>(
        '/api/refine-ui',
        {
          userMessage: request.userMessage,
          fileContent,
          context: request.context,
        }
      );

      logger.info('UI component refined successfully', {
        textLength: response.data.text.length,
      });

      return response.data.text;
    } catch (error) {
      logger.error('Failed to refine UI component', error);
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

// Export singleton instance
export const uiService = new UiService();
