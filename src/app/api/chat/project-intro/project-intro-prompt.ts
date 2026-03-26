interface BuildPromptArgs {
  projectTitle: string
  instructions: string | null
  memoryEntries: string | null
  lastMessages: Array<{ role: string; content: string }>
}

export function buildProjectIntroPrompt(args: BuildPromptArgs): string {
  const { projectTitle, instructions, memoryEntries, lastMessages } = args

  const parts: string[] = [
    `Du hilfst bei einem Projekt: "${projectTitle}".`,
  ]

  if (instructions) {
    parts.push(`Projekt-Kontext: ${instructions}`)
  }

  if (memoryEntries) {
    parts.push(`Bisherige Erkenntnisse:\n${memoryEntries}`)
  }

  if (lastMessages.length > 0) {
    const lastUserMsg = [...lastMessages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      parts.push(`In der letzten Session: "${lastUserMsg.content.slice(0, 200)}"`)
    }
  }

  parts.push(
    'Erstelle eine kurze, kontextuelle Begrüßungsnachricht (2-4 Sätze).',
    'Fasse zusammen was bisher erarbeitet wurde und frage womit der Nutzer weitermachen möchte.',
    'Antworte auf Deutsch. Kein Intro wie "Hallo!" — direkt zur Sache.',
    'Wenn kein Kontext vorhanden: frage freundlich womit gestartet werden soll.',
  )

  return parts.join('\n\n')
}
