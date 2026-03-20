import type { ChipItem } from '@/lib/workspace-types'

export function buildChipsPrompt(lastResponse: string): string {
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
    const parsed = JSON.parse(raw) as { chips?: unknown }
    if (!Array.isArray(parsed.chips)) return []
    return (parsed.chips as ChipItem[])
      .filter(c => typeof c.label === 'string' && typeof c.prompt === 'string')
      .filter(c => c.label.trim().length > 0 && c.prompt.trim().length > 0)
      .slice(0, 4)
  } catch {
    return []
  }
}
