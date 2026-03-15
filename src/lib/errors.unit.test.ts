import { describe, it, expect } from 'vitest'
import { AppError } from './errors'

describe('AppError', () => {
  it('erstellt Error mit code, message und Standard-statusCode 400', () => {
    const err = new AppError('WORKSPACE_NOT_FOUND', 'Workspace nicht gefunden')
    expect(err.code).toBe('WORKSPACE_NOT_FOUND')
    expect(err.message).toBe('Workspace nicht gefunden')
    expect(err.statusCode).toBe(400)
    expect(err.name).toBe('AppError')
  })

  it('erlaubt eigenen statusCode', () => {
    const err = new AppError('UNAUTHORIZED', 'Keine Berechtigung', 403)
    expect(err.statusCode).toBe(403)
  })

  it('ist instanceof Error', () => {
    const err = new AppError('TEST', 'test')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
  })

  it('stack trace ist vorhanden', () => {
    const err = new AppError('TEST', 'test')
    expect(err.stack).toBeDefined()
  })
})
