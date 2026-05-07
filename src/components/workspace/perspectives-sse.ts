// SSE stream helpers for PerspectivesBottomSheet — pure functions, no React.

export interface AvatarResponse {
  avatarId: string
  text: string
  done: boolean
  tokensUsed: number
  error?: string
}

export type ScopeType = 'last_5' | 'last_10' | 'last_20' | 'full'

const VALID_SCOPES: readonly string[] = ['last_5', 'last_10', 'last_20', 'full']

export function resolveScope(contextDefault: string): ScopeType {
  return VALID_SCOPES.includes(contextDefault)
    ? (contextDefault as ScopeType)
    : 'last_10'
}

export function applyParsedEvent(
  prev: Map<string, AvatarResponse>,
  avatarId: string,
  parsed: Record<string, unknown>,
): Map<string, AvatarResponse> {
  const next = new Map(prev)
  const cur = next.get(avatarId) ?? { avatarId, text: '', done: false, tokensUsed: 0 }

  if (parsed.error) {
    next.set(avatarId, { ...cur, error: parsed.error as string, done: true })
    return next
  }
  if (parsed.delta) {
    next.set(avatarId, { ...cur, text: cur.text + (parsed.delta as string) })
  }
  if (parsed.done === true) {
    next.set(avatarId, { ...cur, done: true, tokensUsed: (parsed.tokensUsed as number) ?? cur.tokensUsed })
  }
  return next
}

export async function fetchSseStream(
  url: string,
  body: object,
  signal: AbortSignal,
  onEvent: (parsed: Record<string, unknown>) => void,
  onGlobalDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error: string }
    onError(err.error ?? `HTTP ${res.status}`)
    return
  }

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw || raw === '[DONE]') continue
      let parsed: Record<string, unknown>
      try { parsed = JSON.parse(raw) as Record<string, unknown> } catch { continue }

      if (parsed.done === true && !parsed.avatarId) {
        onGlobalDone()
        continue
      }
      if (parsed.avatarId) onEvent(parsed)
    }
  }
}
