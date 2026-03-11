// src/lib/qa/task-classifier.ts
// Leichtgewichtiger regelbasierter Klassifizierer
// Wird später durch ML-Router ersetzt — jetzt Heuristik reicht

export type TaskType = 'code' | 'translation' | 'summary' | 'vision' | 'chat'

const CODE_PATTERNS = [
  /```[\w]*/,
  /\b(function|const|let|var|def |class |import |export )\b/,
  /\b(bug|error|exception|debug|refactor|implement)\b/i,
]

const TRANSLATION_PATTERNS = [
  // \b funktioniert nicht vor Umlauten (ü ist kein \w-Zeichen) — deshalb ohne Wortgrenze
  /(übersetze?|translate|traduci|traduis)/i,
  /\b(auf (deutsch|englisch|französisch|spanisch))\b/i,
  /\b(in (german|english|french|spanish))\b/i,
]

const SUMMARY_PATTERNS = [
  /\b(zusammenfass|summarize|fass .{1,20} zusammen|tldr)\b/i,
  /\b(erkläre?|explain|beschreibe?)\b/i,
]

export function classifyTask(prompt: string): TaskType {
  if (CODE_PATTERNS.some(p => p.test(prompt))) return 'code'
  if (TRANSLATION_PATTERNS.some(p => p.test(prompt))) return 'translation'
  if (SUMMARY_PATTERNS.some(p => p.test(prompt))) return 'summary'
  return 'chat'
}

export function getRoutingReason(taskType: TaskType, promptLength: number): string {
  if (taskType === 'code')        return 'task:code'
  if (taskType === 'translation') return 'task:translation'
  if (taskType === 'summary')     return 'task:summary'
  if (promptLength > 2000)        return 'complexity:high'
  if (promptLength < 100)         return 'complexity:low'
  return 'complexity:medium'
}
