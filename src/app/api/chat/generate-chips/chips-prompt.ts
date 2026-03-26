import type { ChipItem } from '@/lib/workspace-types'

// Extracts artifact metadata for chip context; strips raw code content
function extractArtifactContext(response: string): { hasArtifact: boolean; artifactName: string; textContext: string } {
  const artifactMatch = /<artifact[^>]+name=["']([^"']+)["'][^>]*>/i.exec(response)
  const hasArtifact = artifactMatch !== null
  const artifactName = artifactMatch?.[1] ?? ''
  // Text outside artifact tags (intro + outro sentence)
  const textContext = response.replace(/<artifact[\s\S]*?<\/artifact>/gi, '').trim().slice(0, 300)
  return { hasArtifact, artifactName, textContext }
}

export function buildChipsPrompt(lastResponse: string): string {
  const { hasArtifact, artifactName, textContext } = extractArtifactContext(lastResponse)

  if (hasArtifact) {
    return [
      'Du bist ein Assistent der kontextuelle Quick-Actions für ein gerade generiertes Artifact vorschlägt.',
      '',
      `Artifact: "${artifactName}"`,
      textContext ? `Kontext: "${textContext}"` : '',
      '',
      'Schlage 3-4 sinnvolle nächste Aktionen vor die mit diesem Artifact arbeiten. Antworte NUR mit validem JSON:',
      '{"chips":[{"label":"Kurzes Label (max 25 Zeichen)","prompt":"Vollständige Aufforderung die der User senden würde"}]}',
      '',
      'Chip-Typen für Artifacts: Design anpassen | Chart hinzufügen | Mit echten Daten befüllen | In Workspace speichern | Exportieren | KPI ergänzen | Filter hinzufügen',
      'Keine generischen Chips — immer konkret zum Artifact-Inhalt.',
      'Antworte auf Deutsch. Nur JSON — kein Text davor oder danach.',
    ].filter(Boolean).join('\n')
  }

  const truncated = lastResponse.slice(0, 500)
  return [
    'Du bist ein Assistent der kontextuelle Quick-Actions vorschlägt.',
    '',
    `Letzte Antwort (gekürzt):\n"""${truncated}"""`,
    '',
    'Schlage 3-4 sinnvolle nächste Aktionen vor. Antworte NUR mit validem JSON:',
    '{"chips":[{"label":"Kurzes Label (max 25 Zeichen)","prompt":"Vollständige Aufforderung die der User senden würde"}]}',
    '',
    'Chip-Typen je nach Kontext: Mehr davon | Vertiefen | Format ändern | Ausformulieren | Nächster Schritt | Hinterfragen',
    'Keine generischen Chips wie "Mehr Infos" — immer konkret zur Antwort.',
    'Antworte auf Deutsch. Nur JSON — kein Text davor oder danach.',
  ].join('\n')
}

export function parseChipsResponse(raw: string): ChipItem[] {
  try {
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const parsed = JSON.parse(stripped) as { chips?: unknown }
    if (!Array.isArray(parsed.chips)) return []
    return (parsed.chips as ChipItem[])
      .filter(c => typeof c.label === 'string' && typeof c.prompt === 'string')
      .filter(c => c.label.trim().length > 0 && c.prompt.trim().length > 0)
      .slice(0, 4)
  } catch {
    return []
  }
}
