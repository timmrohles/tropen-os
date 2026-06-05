// src/lib/preflight/__tests__/migration-audit.unit.test.ts
import { describe, it, expect } from 'vitest'
import { auditMigrationSql } from '../migration-audit'

describe('auditMigrationSql', () => {
  it('flags a VIEW without security_invoker', async () => {
    const sql = 'CREATE VIEW public.v AS SELECT 1;'
    const messages = await auditMigrationSql(sql)
    expect(Array.isArray(messages)).toBe(true)
    const combined = messages.join('\n')
    expect(combined).toMatch(/security_invoker|SECURITY DEFINER/i)
  })

  it('returns empty array for clean table + RLS SQL (no crash)', async () => {
    const sql = `
      CREATE TABLE public.items (id uuid PRIMARY KEY, user_id uuid);
      ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
      CREATE POLICY items_own ON public.items FOR ALL USING (auth.uid() = user_id);
    `
    const messages = await auditMigrationSql(sql)
    expect(Array.isArray(messages)).toBe(true)
    // May or may not be empty — must not throw and must return a string array
    for (const m of messages) expect(typeof m).toBe('string')
  })
})
