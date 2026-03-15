import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validateBody } from './index'

function makeRequest(body: unknown, contentType = 'application/json'): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: JSON.stringify(body),
  })
}

const testSchema = z.object({
  name: z.string().min(1),
  count: z.number().int().positive(),
})

describe('validateBody', () => {
  it('gibt data zurück bei validen Daten', async () => {
    const req = makeRequest({ name: 'Test', count: 5 })
    const result = await validateBody(req, testSchema)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({ name: 'Test', count: 5 })
  })

  it('gibt error NextResponse bei invaliden Daten zurück', async () => {
    const req = makeRequest({ name: '', count: -1 })
    const result = await validateBody(req, testSchema)
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
    const body = await result.error!.json()
    expect(body.error).toBe('Validierungsfehler')
    expect(Array.isArray(body.details)).toBe(true)
  })

  it('gibt 400 bei Validierungsfehler zurück', async () => {
    const req = makeRequest({ name: '' })
    const result = await validateBody(req, testSchema)
    expect(result.error?.status).toBe(400)
  })

  it('gibt error NextResponse bei ungültigem JSON zurück', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'kein-json{{{',
    })
    const result = await validateBody(req, testSchema)
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
    const body = await result.error!.json()
    expect(body.error).toBe('Ungültiger JSON-Body')
  })

  it('gibt 400 bei ungültigem JSON zurück', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      body: 'kaputt',
    })
    const result = await validateBody(req, testSchema)
    expect(result.error?.status).toBe(400)
  })

  it('details enthält Pfad + Fehlermeldung', async () => {
    const req = makeRequest({ name: 'ok', count: 'nicht-eine-zahl' })
    const result = await validateBody(req, testSchema)
    expect(result.data).toBeNull()
    const body = await result.error!.json()
    const detailStr = body.details.join(' ')
    expect(detailStr).toContain('count')
  })
})
