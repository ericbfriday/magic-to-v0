/**
 * HTTP client for communicating with 21st.dev API
 */

import { config } from './config.js';
import { logger } from './logger.js';
import { ExternalServiceError } from './errors.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface HttpClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Headers;
}

class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Magic-MCP-Server/1.0',
      ...(this.config.apiKey ? { 'x-api-key': this.config.apiKey } : {}),
      ...options.headers as Record<string, string>,
    };

    logger.debug(`HTTP ${method} ${url}`, { endpoint, method });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: controller.signal,
        ...(data ? { body: JSON.stringify(data) } : {}),
      });

      clearTimeout(timeoutId);

      logger.debug(`HTTP ${method} ${url} - ${response.status}`, {
        endpoint,
        method,
        status: response.status,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new ExternalServiceError(
          `21st.dev API request failed: ${response.status} ${response.statusText}`,
          '21st.dev',
          {
            status: response.status,
            statusText: response.statusText,
            response: errorText,
          }
        );
      }

      const responseData = await response.json() as T;

      return {
        status: response.status,
        data: responseData,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ExternalServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ExternalServiceError(
            'Request to 21st.dev API timed out',
            '21st.dev',
            { timeout: this.config.timeout }
          );
        }

        throw new ExternalServiceError(
          `Failed to communicate with 21st.dev API: ${error.message}`,
          '21st.dev',
          { originalError: error.message }
        );
      }

      throw new ExternalServiceError(
        'Unknown error communicating with 21st.dev API',
        '21st.dev'
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async delete<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }
}

// Export singleton instance
export const twentyFirstClient = new HttpClient({
  baseUrl: config.baseUrl,
  apiKey: config.apiKey,
});

// Export class for testing
export { HttpClient };
