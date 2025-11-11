/**
 * Structured logging utility
 */

import { config } from './config.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;
  private format: 'json' | 'pretty';

  constructor(level: LogLevel = 'info', format: 'json' | 'pretty' = 'json') {
    this.level = level;
    this.format = format;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...meta,
      pid: process.pid,
    };

    if (this.format === 'json') {
      return JSON.stringify(logData);
    }

    // Pretty format
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()} (${process.pid}): ${message}${metaStr}`;
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, error?: Error | any, meta?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      const errorMeta = {
        ...meta,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      };
      console.error(this.formatMessage('error', message, errorMeta));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setFormat(format: 'json' | 'pretty'): void {
    this.format = format;
  }
}

export const logger = new Logger(config.logging.level, config.logging.format);
