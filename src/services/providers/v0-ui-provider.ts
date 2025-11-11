/**
 * v0 UI Provider (v0.dev)
 *
 * Implementation of UiProvider interface for v0.dev Platform API
 */

import { createClient } from 'v0-sdk';
import type { ChatDetail, ChatsCreateResponse, ChatsSendMessageResponse } from 'v0-sdk';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../utils/errors.js';
import { UiProvider, UiProviderResponse } from './ui-provider.interface.js';
import type { CreateUiRequest, FetchUiRequest, RefineUiRequest } from '../../types/index.js';

interface V0ProviderConfig {
  apiKey: string;
}

/**
 * v0 UI Provider - uses v0.dev Platform API for component generation
 */
export class V0UiProvider implements UiProvider {
  readonly name = 'v0';
  private config: V0ProviderConfig;
  private client: ReturnType<typeof createClient>;

  constructor(config: V0ProviderConfig) {
    this.config = config;
    this.client = createClient({
      apiKey: config.apiKey,
    });
  }

  /**
   * Check if provider is ready to use
   */
  async isReady(): Promise<boolean> {
    try {
      // Try to get user info as a health check
      await this.client.user.get();
      return true;
    } catch (error) {
      logger.warn('v0 provider health check failed', { error });
      return false;
    }
  }

  /**
   * Get provider status
   */
  async getStatus(): Promise<{ available: boolean; configured: boolean; message?: string }> {
    const configured = !!this.config.apiKey;

    if (!configured) {
      return {
        available: false,
        configured: false,
        message: 'v0 provider not configured (missing V0_API_KEY)',
      };
    }

    const ready = await this.isReady();

    if (!ready) {
      return {
        available: false,
        configured: true,
        message: 'v0 provider configured but API connection failed',
      };
    }

    return {
      available: true,
      configured: true,
      message: 'v0 provider ready',
    };
  }

  /**
   * Format chat response for MCP tool compatibility
   */
  private formatChatResponse(chat: ChatDetail, message: string): string {
    const hasFiles = chat.latestVersion?.files && Array.isArray(chat.latestVersion.files);
    const webUrl = chat.webUrl || `https://v0.dev/chat/${chat.id}`;

    let response = `# Generated Component\n\n`;
    response += `**Chat ID**: ${chat.id}\n`;
    response += `**Preview URL**: ${webUrl}\n\n`;

    if (hasFiles && chat.latestVersion && chat.latestVersion.files.length > 0) {
      response += `## Files\n\n`;
      chat.latestVersion.files.forEach((file: any) => {
        response += `### ${file.name || file.path}\n\n`;
        response += `\`\`\`${this.getFileExtension(file.name || file.path)}\n`;
        response += file.content || '';
        response += `\n\`\`\`\n\n`;
      });
    }

    response += `\n## shadcn/ui Instructions\n\n`;
    response += `The component above uses shadcn/ui components. If you encounter missing imports, install them using:\n\n`;
    response += `\`\`\`bash\n`;
    response += `npx shadcn@latest add [component-name]\n`;
    response += `\`\`\`\n\n`;
    response += `You can also view and test the component at: ${webUrl}\n`;

    return response;
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'tsx' || ext === 'ts') return 'tsx';
    if (ext === 'jsx' || ext === 'js') return 'jsx';
    if (ext === 'css') return 'css';
    return 'text';
  }

  /**
   * Create a new UI component using v0.dev
   */
  async createUi(request: CreateUiRequest): Promise<UiProviderResponse> {
    logger.info('v0: Creating component', {
      searchQuery: request.searchQuery,
      file: request.absolutePathToCurrentFile,
    });

    try {
      // Create a new chat with the component request
      const response = await this.client.chats.create({
        message: request.standaloneRequestQuery || request.message,
      });

      // The response could be streaming or direct - handle both
      const chat = 'chat' in response ? (response as any).chat : (response as ChatDetail);

      logger.info('v0: Component created successfully', {
        chatId: chat.id,
        hasFiles: !!chat.latestVersion?.files,
      });

      const responseText = this.formatChatResponse(chat, request.message);
      const webUrl = chat.webUrl || `https://v0.dev/chat/${chat.id}`;

      return {
        text: responseText,
        previewUrl: webUrl,
        files: chat.latestVersion?.files?.map((file: any) => ({
          name: file.name || file.path || 'component.tsx',
          content: file.content || '',
          path: file.path,
        })) || [],
        sessionId: chat.id,
        provider: this.name,
        metadata: {
          source: 'v0.dev',
          method: 'api',
          versionId: chat.latestVersion?.id,
        },
      };
    } catch (error) {
      logger.error('v0: Failed to create component', error);

      // Check if it's an API error with status code
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        throw new ExternalServiceError(
          `v0.dev API error: ${apiError.message || 'Unknown error'}`,
          'v0.dev',
          {
            status: apiError.status,
            code: apiError.code,
          }
        );
      }

      throw new ExternalServiceError(
        'Failed to create UI component with v0.dev',
        'v0.dev',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Fetch UI component inspiration (v0 doesn't have direct search, so create a chat)
   */
  async fetchUi(request: FetchUiRequest): Promise<UiProviderResponse> {
    logger.info('v0: Fetching component inspiration', {
      searchQuery: request.searchQuery,
    });

    try {
      // Create a chat with search query to get inspiration
      const response = await this.client.chats.create({
        message: `Show me examples of: ${request.searchQuery}. ${request.message}`,
      });

      // The response could be streaming or direct - handle both
      const chat = 'chat' in response ? (response as any).chat : (response as ChatDetail);

      logger.info('v0: Component examples fetched successfully', {
        chatId: chat.id,
      });

      const responseText = this.formatChatResponse(chat, request.message);
      const webUrl = chat.webUrl || `https://v0.dev/chat/${chat.id}`;

      return {
        text: responseText,
        previewUrl: webUrl,
        files: chat.latestVersion?.files?.map((file: any) => ({
          name: file.name || file.path || 'component.tsx',
          content: file.content || '',
          path: file.path,
        })) || [],
        sessionId: chat.id,
        provider: this.name,
        metadata: {
          source: 'v0.dev',
          method: 'api',
          type: 'inspiration',
        },
      };
    } catch (error) {
      logger.error('v0: Failed to fetch component inspiration', error);

      // Check if it's an API error with status code
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        throw new ExternalServiceError(
          `v0.dev API error: ${apiError.message || 'Unknown error'}`,
          'v0.dev',
          {
            status: apiError.status,
            code: apiError.code,
          }
        );
      }

      throw new ExternalServiceError(
        'Failed to fetch UI component inspiration from v0.dev',
        'v0.dev',
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
    logger.info('v0: Refining component', {
      file: request.absolutePathToRefiningFile,
      contextLength: request.context.length,
      hasSessionId: !!sessionId,
    });

    try {
      let response: any;
      let chat: ChatDetail;

      if (sessionId) {
        // Continue existing chat
        logger.debug('v0: Continuing existing chat', { sessionId });
        response = await this.client.chats.sendMessage({
          chatId: sessionId,
          message: `${request.userMessage}\n\nCurrent file content:\n\`\`\`tsx\n${fileContent}\n\`\`\`\n\nContext: ${request.context}`,
        });

        // Extract chat from response
        chat = 'chat' in response ? (response as any).chat : (response as ChatDetail);
      } else {
        // Create new chat with refinement request
        logger.debug('v0: Creating new chat for refinement');
        response = await this.client.chats.create({
          message: `Refine this component:\n\n\`\`\`tsx\n${fileContent}\n\`\`\`\n\n${request.userMessage}\n\nContext: ${request.context}`,
        });

        // Extract chat from response
        chat = 'chat' in response ? (response as any).chat : (response as ChatDetail);
      }

      logger.info('v0: Component refined successfully', {
        chatId: chat.id,
        hasFiles: !!chat.latestVersion?.files,
      });

      const responseText = this.formatChatResponse(chat, request.userMessage);
      const webUrl = chat.webUrl || `https://v0.dev/chat/${chat.id}`;

      return {
        text: responseText,
        previewUrl: webUrl,
        files: chat.latestVersion?.files?.map((file: any) => ({
          name: file.name || file.path || 'component.tsx',
          content: file.content || '',
          path: file.path,
        })) || [],
        sessionId: chat.id,
        provider: this.name,
        metadata: {
          source: 'v0.dev',
          method: 'api',
          type: 'refinement',
          continuedChat: !!sessionId,
        },
      };
    } catch (error) {
      logger.error('v0: Failed to refine component', error);

      // Check if it's an API error with status code
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        throw new ExternalServiceError(
          `v0.dev API error: ${apiError.message || 'Unknown error'}`,
          'v0.dev',
          {
            status: apiError.status,
            code: apiError.code,
          }
        );
      }

      throw new ExternalServiceError(
        'Failed to refine UI component with v0.dev',
        'v0.dev',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}
