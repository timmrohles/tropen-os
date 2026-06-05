// src/lib/preflight/ingest.ts
const MIN_CHARS = 20

export function normalizeInput(raw: string): string {
  const text = raw.trim()
  if (text.length < MIN_CHARS) {
    throw new Error('Input zu kurz — gib mehr Detail (mind. ein paar Sätze oder ein Schema).')
  }
  return text
}
