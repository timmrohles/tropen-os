/**
 * Structured logger — JSON in production, readable in development.
 * No PII allowed in log messages. Use redact() for sensitive values.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isProd = process.env.NODE_ENV === 'production'

function write(level: LogLevel, service: string, message: string, ...args: unknown[]) {
  if (isProd) {
    const entry = {
      level,
      service,
      message,
      timestamp: new Date().toISOString(),
      ...(args.length > 0 ? { detail: args.map((a) => (a instanceof Error ? a.message : a)) } : {}),
    }
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(JSON.stringify(entry))
  } else {
    const prefix = `[${service}]`
    if (level === 'error') console.error(prefix, message, ...args)
    else if (level === 'warn') console.warn(prefix, message, ...args)
    else console.log(prefix, message, ...args)
  }
}

export function createLogger(service: string) {
  return {
    debug: (message: string, ...args: unknown[]) => write('debug', service, message, ...args),
    info:  (message: string, ...args: unknown[]) => write('info',  service, message, ...args),
    warn:  (message: string, ...args: unknown[]) => write('warn',  service, message, ...args),
    error: (message: string, ...args: unknown[]) => write('error', service, message, ...args),
  }
}

/** Redact a value from logs — ersetzt mit [REDACTED] */
export function redact(_value: unknown): string {
  return '[REDACTED]'
}
