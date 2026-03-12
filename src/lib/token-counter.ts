/** Rough token estimate: ~4 chars per token for mixed German/English */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function estimateConversationTokens(messages: Array<{ content: string }>): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 10, 0)
}

/** Default limit for claude-sonnet-4-6 */
export const MODEL_CONTEXT_LIMIT = 200_000
