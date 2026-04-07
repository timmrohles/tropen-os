// src/lib/audit/__tests__/rule-registry.unit.test.ts
import { describe, it, expect } from 'vitest'
import { AUDIT_RULES, getRulesForCategory, getRuleById } from '../rule-registry'
import { CATEGORIES } from '../types'

describe('AUDIT_RULES', () => {
  it('has rules for all 25 categories', () => {
    const categoryIds = new Set(AUDIT_RULES.map((r) => r.categoryId))
    for (let i = 1; i <= 25; i++) {
      expect(categoryIds.has(i), `Category ${i} has no rules`).toBe(true)
    }
  })

  it('has at least 100 rules total', () => {
    expect(AUDIT_RULES.length).toBeGreaterThanOrEqual(100)
  })

  it('all rule IDs are unique', () => {
    const ids = AUDIT_RULES.map((r) => r.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all weights are 1, 2, or 3', () => {
    for (const rule of AUDIT_RULES) {
      expect([1, 2, 3]).toContain(rule.weight)
    }
  })

  it('all automatable rules have a check function', () => {
    for (const rule of AUDIT_RULES) {
      if (rule.automatable) {
        expect(rule.check, `Rule ${rule.id} is automatable but has no check function`).toBeDefined()
      }
    }
  })

  it('manual rules have no check function', () => {
    for (const rule of AUDIT_RULES) {
      if (rule.checkMode === 'manual') {
        expect(rule.check, `Manual rule ${rule.id} should not have check function`).toBeUndefined()
      }
    }
  })
})

describe('Category 1 (Architektur)', () => {
  it('has exactly 5 rules', () => {
    expect(getRulesForCategory(1)).toHaveLength(5)
  })

  it('has correct weights [3, 3, 2, 1, 2]', () => {
    const weights = getRulesForCategory(1).map((r) => r.weight)
    expect(weights).toEqual([3, 3, 2, 1, 2])
  })
})

describe('Category 3 (Sicherheit)', () => {
  it('has exactly 14 rules', () => {
    expect(getRulesForCategory(3)).toHaveLength(14)
  })
})

describe('Category 10 (Testing)', () => {
  it('has exactly 5 rules', () => {
    expect(getRulesForCategory(10)).toHaveLength(5)
  })

  it('unit test coverage rule has weight 3', () => {
    const rule = getRuleById('cat-10-rule-1')
    expect(rule?.weight).toBe(3)
  })
})

describe('getRulesForCategory', () => {
  it('returns rules in order for each category', () => {
    for (const cat of CATEGORIES) {
      const rules = getRulesForCategory(cat.id)
      expect(rules.length).toBeGreaterThan(0)
    }
  })
})

describe('ruleId override for reused check functions', () => {
  it('cat-13-rule-4 check returns ruleId cat-13-rule-4', async () => {
    const rule = getRuleById('cat-13-rule-4')
    expect(rule?.check).toBeDefined()
    // The check function needs a mock context — just verify it returns the correct ruleId
    // We'll call it with a minimal context and check ruleId
    const mockCtx = {
      rootPath: '/nonexistent',
      repoMap: { files: [], dependencies: [], rankedSymbols: [], stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 }, generatedAt: '', rootPath: '/nonexistent', version: '1.0.0', compressedMap: '' },
      packageJson: {}, tsConfig: {}, filePaths: [], gitInfo: { hasGitDir: false, recentCommits: [] },
    }
    const result = await rule!.check!(mockCtx as never)
    expect(result.ruleId).toBe('cat-13-rule-4')
  })

  it('cat-13-rule-5 check returns ruleId cat-13-rule-5', async () => {
    const rule = getRuleById('cat-13-rule-5')
    const mockCtx = {
      rootPath: '/nonexistent',
      repoMap: { files: [], dependencies: [], rankedSymbols: [], stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 }, generatedAt: '', rootPath: '/nonexistent', version: '1.0.0', compressedMap: '' },
      packageJson: {}, tsConfig: {}, filePaths: [], gitInfo: { hasGitDir: false, recentCommits: [] },
    }
    const result = await rule!.check!(mockCtx as never)
    expect(result.ruleId).toBe('cat-13-rule-5')
  })
})
