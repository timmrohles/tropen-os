import { describe, it, expect, afterEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { logRoutingDecision } from './routing-logger'

// Echte Supabase-Verbindung — läuft nur wenn .env.test.local gesetzt ist

describe('Integration: routing-logger → Supabase', () => {
  const testTaskType = `integration-test-${Date.now()}`

  afterEach(async () => {
    const supabase = createServiceClient()
    await supabase
      .from('qa_routing_log')
      .delete()
      .eq('task_type', testTaskType)
  })

  it('schreibt einen Eintrag in qa_routing_log', async () => {
    logRoutingDecision({
      taskType: testTaskType,
      modelSelected: 'gpt-4o-mini',
      routingReason: 'test:integration',
      latencyMs: 123,
      status: 'success',
    })

    await new Promise(r => setTimeout(r, 500))

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('qa_routing_log')
      .select('*')
      .eq('task_type', testTaskType)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].model_selected).toBe('gpt-4o-mini')
    expect(data![0].latency_ms).toBe(123)
    expect(data![0].status).toBe('success')
    expect(data![0].user_id).toBeNull()
  })

  it('hasht user_id korrekt', async () => {
    logRoutingDecision({
      taskType: testTaskType,
      modelSelected: 'gpt-4o-mini',
      routingReason: 'test:integration',
      latencyMs: 50,
      status: 'success',
      userId: 'test-user-abc',
    })

    await new Promise(r => setTimeout(r, 500))

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('qa_routing_log')
      .select('user_id')
      .eq('task_type', testTaskType)

    expect(data![0].user_id).not.toBe('test-user-abc')
    expect(data![0].user_id).toMatch(/^[a-f0-9]{16}$/)
  })
})
