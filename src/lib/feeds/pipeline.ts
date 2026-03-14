// src/lib/feeds/pipeline.ts
// Three-stage feed processing pipeline.
// Stage 1: rule-based (0 tokens)
// Stage 2: Haiku relevance scoring (max 300 output tokens)
// Stage 3: Sonnet deep processing (max 10 items/batch)

import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type { RawFeedItem, FeedSource, Stage2Result } from '@/types/feeds'

const log = createLogger('feeds:pipeline')

let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function computeContentHash(url: string, title: string): string {
  return createHash('sha256').update(url + '\x00' + title).digest('hex')
}

// ---------------------------------------------------------------------------
// Stage 1 — rule-based filter (no AI, no tokens)
// ---------------------------------------------------------------------------

export function runStage1(
  item: RawFeedItem,
  source: FeedSource,
): { passed: boolean; reason: string } {
  const text = `${item.title} ${item.content ?? ''}`.toLowerCase()

  // 1. Age check — older than 7 days → out
  if (item.publishedAt) {
    const ageDays = (Date.now() - item.publishedAt.getTime()) / 86_400_000
    if (ageDays > 7) {
      return { passed: false, reason: `Item is ${Math.floor(ageDays)} days old (max 7)` }
    }
  }

  // 2. Minimum content length
  const combinedLength = item.title.length + (item.content?.length ?? 0)
  if (combinedLength < 50) {
    return { passed: false, reason: 'Content too short (< 50 chars)' }
  }

  // 3. Domain allow-list
  if (source.domainsAllow.length > 0) {
    try {
      const domain = new URL(item.url).hostname.replace(/^www\./, '')
      if (!source.domainsAllow.some((d) => domain.endsWith(d))) {
        return { passed: false, reason: `Domain "${domain}" not in allow-list` }
      }
    } catch {
      return { passed: false, reason: 'Invalid URL' }
    }
  }

  // 4. Keywords include — at least one must match
  if (source.keywordsInclude.length > 0) {
    const hasMatch = source.keywordsInclude.some((kw) => text.includes(kw.toLowerCase()))
    if (!hasMatch) {
      return { passed: false, reason: `None of required keywords matched: [${source.keywordsInclude.join(', ')}]` }
    }
  }

  // 5. Keywords exclude — none may match
  for (const kw of source.keywordsExclude) {
    if (text.includes(kw.toLowerCase())) {
      return { passed: false, reason: `Excluded keyword matched: "${kw}"` }
    }
  }

  return { passed: true, reason: 'All Stage 1 rules passed' }
}

// ---------------------------------------------------------------------------
// Stage 2 — Haiku relevance scoring
// ---------------------------------------------------------------------------

async function buildStage2Prompt(source: FeedSource): Promise<string> {
  const { data: negRows, error: negErr } = await supabaseAdmin
    .from('feed_items')
    .select('title')
    .eq('source_id', source.id)
    .eq('status', 'not_relevant')
    .order('created_at', { ascending: false })
    .limit(10)
  if (negErr) log.warn('[stage2] failed to load negative examples', { sourceId: source.id, error: negErr.message })

  const negExamples = (negRows ?? []).map((r) => (r as { title: string }).title).filter(Boolean)

  let prompt = `Du bewertest die Relevanz von Nachrichtenartikeln für die Feed-Quelle "${source.name}".

Bewerte jeden Artikel auf einer Skala von 1-10 (1 = völlig irrelevant, 10 = sehr relevant).

Antworte NUR mit JSON: { "score": <1-10>, "reason": "<kurze Begründung>" }`

  if (negExamples.length >= 5) {
    prompt += `\n\nDiese Themen sind für diese Quelle NICHT relevant (Nutzer-Feedback):\n${negExamples.map((t) => `- "${t}"`).join('\n')}`
  }

  return prompt
}

export async function runStage2(
  itemId: string,
  item: RawFeedItem,
  source: FeedSource,
): Promise<Stage2Result & { error: boolean }> {
  const systemPrompt = await buildStage2Prompt(source)
  const excerpt = (item.content ?? '').slice(0, 200)
  const startMs = Date.now()

  let tokensIn = 0, tokensOut = 0
  let result: Stage2Result & { error: boolean } = { score: 0, reason: 'Stage 2 failed', error: true }
  let errorMsg: string | null = null

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Titel: ${item.title}\n\nAuszug: ${excerpt}` }],
    })
    tokensIn = response.usage.input_tokens
    tokensOut = response.usage.output_tokens

    const raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      result = { score: Math.min(10, Math.max(1, Number(parsed.score) || 1)), reason: String(parsed.reason ?? ''), error: false }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
    log.error('[stage2] failed', { itemId, error: errorMsg })
  }

  await supabaseAdmin.from('feed_processing_log').insert({
    source_id: source.id,
    stage: 2,
    items_in: 1,
    items_out: result.score >= source.minScore ? 1 : 0,
    items_dropped: result.score < source.minScore ? 1 : 0,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_eur: (tokensIn * 0.00000025) + (tokensOut * 0.00000125),
    duration_ms: Date.now() - startMs,
    error: errorMsg,
  })

  return { ...result, error: errorMsg !== null }
}

// ---------------------------------------------------------------------------
// Stage 3 — Sonnet deep processing (single item)
// ---------------------------------------------------------------------------

export async function runStage3(
  itemId: string,
  item: RawFeedItem,
  source: FeedSource,
): Promise<{ summary: string; keyFacts: string[] }> {
  const startMs = Date.now()
  let tokensIn = 0, tokensOut = 0
  let result = { summary: '', keyFacts: [] as string[] }
  let errorMsg: string | null = null

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `Du fasst Nachrichtenartikel für "${source.name}" zusammen.
Antworte NUR mit JSON:
{
  "summary": "<2-3 Sätze auf Deutsch>",
  "key_facts": ["<Fakt 1>", "<Fakt 2>", "<Fakt 3>"]
}`,
      messages: [{ role: 'user', content: `Titel: ${item.title}\n\nInhalt: ${item.content ?? '(kein Inhalt)'}` }],
    })
    tokensIn = response.usage.input_tokens
    tokensOut = response.usage.output_tokens

    const raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      result = {
        summary: String(parsed.summary ?? ''),
        keyFacts: Array.isArray(parsed.key_facts)
          ? parsed.key_facts.filter((f): f is string => typeof f === 'string').slice(0, 5)
          : [],
      }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
    log.error('[stage3] failed', { itemId, error: errorMsg })
  }

  await supabaseAdmin.from('feed_processing_log').insert({
    source_id: source.id,
    stage: 3,
    items_in: 1,
    items_out: result.summary ? 1 : 0,
    items_dropped: result.summary ? 0 : 1,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_eur: (tokensIn * 0.000003) + (tokensOut * 0.000015),
    duration_ms: Date.now() - startMs,
    error: errorMsg,
  })

  return result
}

// ---------------------------------------------------------------------------
// Main entry: process one raw item end-to-end
// Returns the feed_item id (or null on critical error)
// ---------------------------------------------------------------------------

export async function processItem(item: RawFeedItem, source: FeedSource): Promise<string | null> {
  const contentHash = computeContentHash(item.url, item.title)

  const { data: existing } = await supabaseAdmin
    .from('feed_items')
    .select('id')
    .eq('content_hash', contentHash)
    .maybeSingle()
  if (existing) return existing.id as string

  const s1 = runStage1(item, source)

  const { data: row, error: insertErr } = await supabaseAdmin
    .from('feed_items')
    .insert({
      source_id: source.id,
      organization_id: source.organizationId,
      title: item.title,
      content: item.content ?? null,
      url: item.url,
      author: item.author ?? null,
      published_at: item.publishedAt?.toISOString() ?? null,
      stage: 1,
      content_hash: contentHash,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      metadata: item.metadata ?? {},
    })
    .select('id')
    .single()

  if (insertErr || !row) {
    log.error('[processItem] insert failed', { error: insertErr?.message })
    return null
  }

  const itemId = row.id as string
  if (!s1.passed) return itemId

  const s2 = await runStage2(itemId, item, source)
  if (s2.error && s2.score === 0) {
    // Stage 2 failed entirely — don't mark as processed so it can be retried
    // Reset content_hash to allow reprocessing (delete and let next run re-insert)
    await supabaseAdmin.from('feed_items').update({ status: 'deleted' }).eq('id', itemId)
    log.warn('[processItem] Stage 2 failed, item marked deleted for retry', { itemId })
    return null
  }
  const updates: Record<string, unknown> = {
    stage: 2,
    score: s2.score,
    score_reason: s2.reason,
  }

  if (s2.score >= source.minScore) {
    const s3 = await runStage3(itemId, item, source)
    updates.stage = 3
    updates.summary = s3.summary || null
    updates.key_facts = s3.keyFacts.length > 0 ? s3.keyFacts : null
  }

  const { error: updateErr } = await supabaseAdmin.from('feed_items').update(updates).eq('id', itemId)
  if (updateErr) log.error('[processItem] failed to update item after stages', { itemId, error: updateErr.message })
  return itemId
}
