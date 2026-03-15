import { describe, it, expect } from 'vitest'
import { estimateTokens, estimateConversationTokens, MODEL_CONTEXT_LIMIT } from './token-counter'

describe('estimateTokens', () => {
  it('gibt 0 für leeren String zurück', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('schätzt ~1 Token für 4 Zeichen', () => {
    expect(estimateTokens('Test')).toBe(1)
  })

  it('rundet auf (ceil)', () => {
    // 5 Zeichen → ceil(5/4) = 2
    expect(estimateTokens('Hello')).toBe(2)
  })

  it('schätzt realistischen deutschen Satz', () => {
    const text = 'Das ist ein Test für den Token-Counter.'
    const tokens = estimateTokens(text)
    // 39 Zeichen → ceil(39/4) = 10
    expect(tokens).toBe(10)
    expect(tokens).toBeGreaterThan(0)
  })

  it('skaliert linear mit der Textlänge', () => {
    const short = estimateTokens('kurz')
    const long = estimateTokens('kurz'.repeat(10))
    expect(long).toBe(short * 10)
  })
})

describe('estimateConversationTokens', () => {
  it('gibt 0 für leere Konversation zurück', () => {
    expect(estimateConversationTokens([])).toBe(0)
  })

  it('addiert 10 Overhead-Token pro Nachricht', () => {
    // Leerer content → nur Overhead
    const result = estimateConversationTokens([{ content: '' }, { content: '' }])
    expect(result).toBe(20) // 2 × 10 Overhead
  })

  it('berechnet Summe über mehrere Nachrichten', () => {
    const messages = [
      { content: 'Hallo' },   // ceil(5/4)=2 + 10 = 12
      { content: 'Wie geht' }, // ceil(8/4)=2 + 10 = 12
    ]
    expect(estimateConversationTokens(messages)).toBe(24)
  })
})

describe('MODEL_CONTEXT_LIMIT', () => {
  it('ist für Claude Sonnet auf 200.000 gesetzt', () => {
    expect(MODEL_CONTEXT_LIMIT).toBe(200_000)
  })
})
