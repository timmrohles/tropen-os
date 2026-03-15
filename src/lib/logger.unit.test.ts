import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger, redact } from './logger'

describe('createLogger', () => {
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; warn: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> }

  beforeEach(() => {
    consoleSpy = {
      log:   vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn:  vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gibt ein Logger-Objekt mit debug/info/warn/error zurück', () => {
    const logger = createLogger('test-service')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('info schreibt via console.log', () => {
    const logger = createLogger('test')
    logger.info('Testnachricht')
    expect(consoleSpy.log).toHaveBeenCalledOnce()
  })

  it('warn schreibt via console.warn', () => {
    const logger = createLogger('test')
    logger.warn('Warnung')
    expect(consoleSpy.warn).toHaveBeenCalledOnce()
  })

  it('error schreibt via console.error', () => {
    const logger = createLogger('test')
    logger.error('Fehler')
    expect(consoleSpy.error).toHaveBeenCalledOnce()
  })

  it('debug schreibt via console.log', () => {
    const logger = createLogger('test')
    logger.debug('Debug-Info')
    expect(consoleSpy.log).toHaveBeenCalledOnce()
  })

  it('schließt Service-Name im Output ein', () => {
    const logger = createLogger('my-service')
    logger.info('Testnachricht')
    const call = consoleSpy.log.mock.calls[0]
    expect(call.some((arg: unknown) => String(arg).includes('my-service'))).toBe(true)
  })

  it('mehrere Logger für verschiedene Services sind unabhängig', () => {
    const a = createLogger('service-a')
    const b = createLogger('service-b')
    a.info('von A')
    b.warn('von B')
    expect(consoleSpy.log).toHaveBeenCalledOnce()
    expect(consoleSpy.warn).toHaveBeenCalledOnce()
  })
})

describe('redact', () => {
  it('gibt immer [REDACTED] zurück', () => {
    expect(redact('mein-passwort')).toBe('[REDACTED]')
    expect(redact(12345)).toBe('[REDACTED]')
    expect(redact(null)).toBe('[REDACTED]')
    expect(redact({ email: 'user@example.com' })).toBe('[REDACTED]')
  })
})
