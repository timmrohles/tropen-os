export type ArtifactType = 'react' | 'chart' | 'code' | 'document' | 'table' | 'list' | 'data' | 'image' | 'other' | 'presentation'

export interface ArtifactSegment {
  segType: 'artifact'
  artifactType: ArtifactType
  name: string
  language?: string
  content: string
  slideCount?: number  // nur für type="presentation", aus slides="N" Attribut
}

export interface TextSegment {
  segType: 'text'
  content: string
}

export type ContentSegment = ArtifactSegment | TextSegment

const VALID_TYPES: ArtifactType[] = ['react', 'chart', 'code', 'document', 'table', 'list', 'data', 'image', 'other', 'presentation']

// Strip markdown code fences (```jsx ... ```) that Toro sometimes wraps around code.
function stripCodeFences(content: string): string {
  return content.replace(/^```[\w]*\n?/m, '').replace(/\n?```\s*$/m, '').trim()
}

// Regex is stateless — create new instance per call to avoid lastIndex issues.
// Flags: i = case-insensitive (handles </Artifact> etc.)
// Closing tag allows optional whitespace: </artifact >, < / artifact>, etc.
function makeArtifactRe() {
  return /<artifact\s+([^>]+)>([\s\S]*?)<\s*\/\s*artifact\s*>/gi
}

function parseAttrs(attrsStr: string): Record<string, string> {
  const result: Record<string, string> = {}
  // Supports both double and single quotes: key="val" or key='val'
  const attrRe = /(\w+)=["']([^"']*)["']/g
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(attrsStr)) !== null) {
    result[m[1]] = m[2]
  }
  return result
}

export function parseArtifacts(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  const re = makeArtifactRe()
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    appendLeadingText(segments, content, lastIndex, match.index)
    segments.push(buildArtifactSegment(match[1], match[2]))
    lastIndex = match.index + match[0].length
  }

  appendRemainder(segments, content, lastIndex)
  return segments
}

// ---------------------------------------------------------------------------
// Helpers (extracted to reduce CC of parseArtifacts)
// ---------------------------------------------------------------------------

/** Resolves a raw type string to a valid ArtifactType (fallback: 'code'). */
function resolveArtifactType(rawType: string): ArtifactType {
  return VALID_TYPES.includes(rawType as ArtifactType) ? (rawType as ArtifactType) : 'code'
}

/** Builds an ArtifactSegment from the matched attribute string and raw body. */
function buildArtifactSegment(attrsStr: string, rawBody: string): ArtifactSegment {
  const attrs = parseAttrs(attrsStr)
  return {
    segType: 'artifact',
    artifactType: resolveArtifactType(attrs.type ?? 'code'),
    name: attrs.name ?? attrs.title ?? 'Artefakt',
    language: attrs.language,
    content: stripCodeFences(rawBody.trim()),
    slideCount: attrs.slides ? parseInt(attrs.slides, 10) : undefined,
  }
}

/** Pushes a text segment if the slice between lastIndex and matchIndex is non-empty. */
function appendLeadingText(
  segments: ContentSegment[],
  content: string,
  lastIndex: number,
  matchIndex: number,
): void {
  if (matchIndex <= lastIndex) return
  const text = content.slice(lastIndex, matchIndex)
  if (text) segments.push({ segType: 'text', content: text })
}

/**
 * Handles the tail after the last complete match.
 * - Detects unclosed artifacts (streaming / token-truncated).
 * - Falls back to plain text.
 */
function appendRemainder(segments: ContentSegment[], content: string, lastIndex: number): void {
  if (lastIndex >= content.length) return
  const remaining = content.slice(lastIndex)
  if (!remaining) return

  const unclosed = /^([\s\S]*?)<artifact\s+([^>]+)>([\s\S]*)$/i.exec(remaining)
  if (!unclosed) {
    segments.push({ segType: 'text', content: remaining })
    return
  }

  if (unclosed[1]) segments.push({ segType: 'text', content: unclosed[1] })
  segments.push(buildArtifactSegment(unclosed[2], unclosed[3]))
}
