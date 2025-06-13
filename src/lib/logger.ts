export class Logger {
    private static formatMessage(level: string, message: string, meta?: any): string {
      const timestamp = new Date().toISOString();
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
  
    static info(message: string, meta?: any) {
      console.log(this.formatMessage('info', message, meta));
    }
  
    static warn(message: string, meta?: any) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  
    static error(message: string, error?: Error | any, meta?: any) {
      const errorMeta = error ? { 
        message: error.message, 
        stack: error.stack,
        ...meta 
      } : meta;
      console.error(this.formatMessage('error', message, errorMeta));
    }
  
    static debug(message: string, meta?: any) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(this.formatMessage('debug', message, meta));
      }
    }
  }