export interface LogPayload {
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  requestId?: string;
  timestamp: string;
  meta?: Record<string, any>;
}

class StructuredLogger {
  private format(level: LogPayload['level'], message: string, requestId?: string, meta?: any): string {
    const log: LogPayload = {
      level,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      meta
    };

    if (process.env.NODE_ENV === 'development') {
      const idPrefix = requestId ? `[${requestId.slice(0, 8)}] ` : '';
      return `[${log.timestamp}] [${level}] ${idPrefix}${message} ${meta ? JSON.stringify(meta) : ''}`.trim();
    }

    return JSON.stringify(log);
  }

  info(message: string, requestId?: string, meta?: any): void {
    console.log(this.format('INFO', message, requestId, meta));
  }

  warn(message: string, requestId?: string, meta?: any): void {
    console.warn(this.format('WARN', message, requestId, meta));
  }

  error(message: string, requestId?: string, meta?: any): void {
    console.error(this.format('ERROR', message, requestId, meta));
  }

  debug(message: string, requestId?: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.format('DEBUG', message, requestId, meta));
    }
  }
}

export const logger = new StructuredLogger();
