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
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text) segments.push({ segType: 'text', content: text })
    }

    const attrs = parseAttrs(match[1])
    const rawType = attrs.type ?? 'code'
    const artifactType: ArtifactType = VALID_TYPES.includes(rawType as ArtifactType)
      ? (rawType as ArtifactType)
      : 'code'

    segments.push({
      segType: 'artifact',
      artifactType,
      name: attrs.name ?? attrs.title ?? 'Artefakt',
      language: attrs.language,
      content: stripCodeFences(match[2].trim()),
      slideCount: attrs.slides ? parseInt(attrs.slides, 10) : undefined,
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex)
    if (remaining) {
      // Handle unclosed artifact (still streaming or token-truncated)
      const unclosed = /^([\s\S]*?)<artifact\s+([^>]+)>([\s\S]*)$/i.exec(remaining)
      if (unclosed) {
        if (unclosed[1]) segments.push({ segType: 'text', content: unclosed[1] })
        const attrs = parseAttrs(unclosed[2])
        const rawType = attrs.type ?? 'code'
        const artifactType: ArtifactType = VALID_TYPES.includes(rawType as ArtifactType)
          ? (rawType as ArtifactType)
          : 'code'
        segments.push({
          segType: 'artifact',
          artifactType,
          name: attrs.name ?? attrs.title ?? 'Artefakt',
          language: attrs.language,
          content: stripCodeFences(unclosed[3].trim()),
          slideCount: attrs.slides ? parseInt(attrs.slides, 10) : undefined,
        })
      } else {
        segments.push({ segType: 'text', content: remaining })
      }
    }
  }

  return segments
}
