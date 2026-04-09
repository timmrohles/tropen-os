// src/lib/review/prompt-builder.ts
// Builds the review prompt from codebase context

export const REVIEW_SYSTEM_PROMPT = `You are a senior software engineer performing a security and architecture code review.
Analyze the provided codebase context and return a JSON array of findings.

Each finding must have this shape:
{
  "ruleRef": string,        // rule category like "auth", "rls", "injection", "secrets", "cors", etc.
  "severity": "critical" | "high" | "medium" | "low" | "info",
  "message": string,        // concise description of the problem
  "filePath": string | null,
  "suggestion": string | null,
  "confidence": number      // 0.0–1.0
}

Return ONLY a JSON array — no prose, no markdown, no explanation outside the JSON block.
If you find nothing significant, return an empty array [].`

interface ReviewContext {
  repoSummary: string
  criticalFiles: string[]   // file paths to highlight
  recentFindings: string[]  // existing open findings for context (not to duplicate)
}

export function buildReviewPrompt(ctx: ReviewContext): string {
  const fileList = ctx.criticalFiles.length > 0
    ? `\nFocus especially on these files:\n${ctx.criticalFiles.map((f) => `- ${f}`).join('\n')}`
    : ''

  const existing = ctx.recentFindings.length > 0
    ? `\nKnown open issues (skip if you find the same):\n${ctx.recentFindings.slice(0, 20).join('\n')}`
    : ''

  return `Review the following codebase for security vulnerabilities, architectural anti-patterns, and quality issues.${fileList}${existing}

## Codebase Context

${ctx.repoSummary}

Return your findings as a JSON array.`
}
