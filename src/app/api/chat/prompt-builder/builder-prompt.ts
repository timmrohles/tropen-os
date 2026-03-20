interface BuilderStep {
  originalPrompt: string
  history: Array<{ role: string; content: string }>
}

export function buildBuilderStep({ originalPrompt, history }: BuilderStep): string {
  const isFirst = history.length === 0

  if (isFirst) {
    return [
      'Du bist ein Experte für präzise KI-Prompts.',
      `Nutzer-Anfrage: "${originalPrompt}"`,
      '',
      'Stelle genau EINE Frage um die Anfrage zu präzisieren.',
      'Frag nach: Was soll das Ergebnis sein? (Dokument, Liste, Analyse, Text?)',
      'Kurz und direkt. Auf Deutsch.',
    ].join('\n')
  }

  const historyText = history
    .map(m => `${m.role === 'user' ? 'Nutzer' : 'Toro'}: ${m.content}`)
    .join('\n')

  const turnCount = history.filter(m => m.role === 'user').length

  if (turnCount >= 2) {
    return [
      'Du bist ein Experte für präzise KI-Prompts.',
      `Original: "${originalPrompt}"`,
      '',
      'Bisheriges Gespräch:',
      historyText,
      '',
      'Erstelle jetzt den finalen, präzisen Prompt. Format:',
      '{"type":"final","prompt":"[vollständiger optimierter Prompt]"}',
      'Nur JSON — kein Text.',
    ].join('\n')
  }

  return [
    'Du bist ein Experte für präzise KI-Prompts.',
    `Original: "${originalPrompt}"`,
    '',
    'Bisheriges Gespräch:',
    historyText,
    '',
    'Stelle noch genau EINE weitere Frage oder erstelle den finalen Prompt wenn du genug Kontext hast.',
    'Für weitere Frage: normaler Text.',
    'Für finalen Prompt: {"type":"final","prompt":"[vollständiger Prompt]"}',
  ].join('\n')
}
