/**
 * HTTP Callback Server for receiving UI component data from browser
 */

import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import net from 'net';
import { logger } from '../utils/logger.js';
import { CallbackResponse } from '../types/index.js';
import { TimeoutError } from '../utils/errors.js';

export interface CallbackServerConfig {
  timeout?: number;
  port?: number;
}

export class CallbackServer {
  private server: Server | null = null;
  private port: number;
  private timeoutId?: NodeJS.Timeout;
  private promiseResolve?: (value: CallbackResponse) => void;
  private promiseReject?: (reason: any) => void;

  constructor(port = 9221) {
    this.port = port;
  }

  getPort(): number {
    return this.port;
  }

  /**
   * Find an available port starting from the given port
   */
  private async findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      if (await this.isPortAvailable(port)) {
        logger.debug(`Found available port: ${port}`);
        return port;
      }
    }
    throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
  }

  /**
   * Check if a port is available
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const tester = net
        .createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.close();
          resolve(true);
        })
        .listen(port, '127.0.0.1');
    });
  }

  /**
   * Parse request body
   */
  private parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle data POST request
    if (req.method === 'POST' && req.url === '/data') {
      const body = await this.parseBody(req);

      logger.debug('Received callback data', { bodyLength: body.length });

      if (this.promiseResolve) {
        if (this.timeoutId) clearTimeout(this.timeoutId);

        this.promiseResolve({ data: body });
        this.shutdown();

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('success');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server not ready');
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  };

  /**
   * Shutdown the server
   */
  private async shutdown(): Promise<void> {
    if (this.server) {
      logger.debug('Shutting down callback server', { port: this.port });
      this.server.close();
      this.server = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  /**
   * Wait for callback data
   */
  async waitForCallback(config: CallbackServerConfig = {}): Promise<CallbackResponse> {
    const { timeout = 600000 } = config;

    try {
      this.port = await this.findAvailablePort(config.port || this.port);

      this.server = createServer(this.handleRequest);
      this.server.listen(this.port, '127.0.0.1');

      logger.info('Callback server listening', {
        port: this.port,
        url: `http://127.0.0.1:${this.port}/data`,
        timeout,
      });

      return new Promise<CallbackResponse>((resolve, reject) => {
        this.promiseResolve = resolve;
        this.promiseReject = reject;

        if (!this.server) {
          reject(new Error('Failed to start callback server'));
          return;
        }

        this.server.on('error', (error) => {
          logger.error('Callback server error', error);
          if (this.promiseReject) this.promiseReject(error);
        });

        this.timeoutId = setTimeout(() => {
          logger.warn('Callback server timed out', { port: this.port, timeout });
          resolve({ timedOut: true });
          this.shutdown();
        }, timeout);
      });
    } catch (error) {
      logger.error('Failed to start callback server', error);
      await this.shutdown();
      throw error;
    }
  }
}
