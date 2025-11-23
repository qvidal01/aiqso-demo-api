import { getConfig } from './config.js';

const config = getConfig();

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

const log = (level: LogLevel, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const color = colors[level];
  const reset = colors.reset;

  const logMessage = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

  if (config.server.nodeEnv === 'development') {
    console.log(logMessage);
    if (meta) {
      console.log(color + JSON.stringify(meta, null, 2) + reset);
    }
  } else {
    // In production, use JSON format for better log aggregation
    console.log(
      JSON.stringify({
        timestamp,
        level,
        message,
        meta,
      })
    );
  }
};

export const logger = {
  info: (message: string, meta?: any) => log('info', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  error: (message: string, meta?: any) => log('error', message, meta),
  debug: (message: string, meta?: any) => {
    if (config.server.nodeEnv === 'development') {
      log('debug', message, meta);
    }
  },
};
