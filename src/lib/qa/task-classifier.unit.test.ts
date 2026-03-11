import { describe, it, expect } from 'vitest'
import { classifyTask, getRoutingReason } from './task-classifier'

describe('classifyTask', () => {
  describe('Code-Erkennung', () => {
    it('erkennt Code-Blöcke mit Backticks', () => {
      expect(classifyTask('Was macht dieser Code? ```js console.log("hi") ```')).toBe('code')
    })
    it('erkennt TypeScript-Keywords', () => {
      expect(classifyTask('const x = 5; function foo() {}')).toBe('code')
    })
    it('erkennt Python-Syntax', () => {
      expect(classifyTask('def calculate(x): return x * 2')).toBe('code')
    })
    it('erkennt Debug-Intent', () => {
      expect(classifyTask('Kannst du diesen Bug fixen?')).toBe('code')
    })
    it('erkennt Refactoring-Intent', () => {
      expect(classifyTask('Bitte refactor diese Funktion')).toBe('code')
    })
  })

  describe('Übersetzungs-Erkennung', () => {
    it('erkennt deutsches Übersetzungs-Keyword', () => {
      expect(classifyTask('Übersetze diesen Text ins Englische')).toBe('translation')
    })
    it('erkennt englisches translate-Keyword', () => {
      expect(classifyTask('Please translate this to German')).toBe('translation')
    })
    it('erkennt Zielsprache im Prompt', () => {
      expect(classifyTask('Bitte auf Englisch formulieren')).toBe('translation')
    })
  })

  describe('Zusammenfassungs-Erkennung', () => {
    it('erkennt zusammenfassen', () => {
      expect(classifyTask('Fass diesen Artikel zusammen')).toBe('summary')
    })
    it('erkennt summarize', () => {
      expect(classifyTask('Please summarize the following text')).toBe('summary')
    })
    it('erkennt TLDR', () => {
      expect(classifyTask('tldr this article please')).toBe('summary')
    })
  })

  describe('Chat-Fallback', () => {
    it('klassifiziert kurze Grüße als chat', () => {
      expect(classifyTask('Hallo!')).toBe('chat')
    })
    it('klassifiziert allgemeine Fragen als chat', () => {
      expect(classifyTask('Was ist die Hauptstadt von Frankreich?')).toBe('chat')
    })
    it('gibt chat zurück bei leerem String', () => {
      expect(classifyTask('')).toBe('chat')
    })
  })

  describe('Priorität bei Überschneidungen', () => {
    it('priorisiert code über summary wenn beides zutrifft', () => {
      // "Erkläre" ist Summary-Pattern, aber ```code``` ist Code-Pattern
      const result = classifyTask('Erkläre mir diesen Code: ```python print("hi")```')
      expect(result).toBe('code')
    })
  })
})

describe('getRoutingReason', () => {
  it('gibt task-spezifischen Reason für code zurück', () => {
    expect(getRoutingReason('code', 100)).toBe('task:code')
  })
  it('gibt task-spezifischen Reason für translation zurück', () => {
    expect(getRoutingReason('translation', 100)).toBe('task:translation')
  })
  it('gibt task-spezifischen Reason für summary zurück', () => {
    expect(getRoutingReason('summary', 100)).toBe('task:summary')
  })
  it('gibt complexity:high für lange chat-Prompts zurück', () => {
    expect(getRoutingReason('chat', 2500)).toBe('complexity:high')
  })
  it('gibt complexity:low für kurze chat-Prompts zurück', () => {
    expect(getRoutingReason('chat', 50)).toBe('complexity:low')
  })
  it('gibt complexity:medium für mittlere chat-Prompts zurück', () => {
    expect(getRoutingReason('chat', 500)).toBe('complexity:medium')
  })
  it('Reason-Format ist immer category:value', () => {
    const reason = getRoutingReason('chat', 200)
    expect(reason).toMatch(/^[a-z]+:[a-z]+$/)
  })
})
