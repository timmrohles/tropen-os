import { createAnthropic } from '@ai-sdk/anthropic'

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  // Expliziter v1-Endpoint — ohne /v1 erzeugt die SDK-Version api.anthropic.com/messages → 404.
  baseURL: 'https://api.anthropic.com/v1',
})
