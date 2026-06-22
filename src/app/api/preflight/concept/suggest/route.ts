// src/app/api/preflight/concept/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { validateBody } from '@/lib/validators'
import { conceptSuggestBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:concept:suggest')

export const POST = withAuth(async (req: NextRequest, { auth: me }) => {
  const { data, error: validationError } = await validateBody(req, conceptSuggestBody)
  if (validationError) return validationError

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  const system = `Du bist ein Produkt-Coach. Aus einer dünnen Idee schlägst du knappe Erstentwürfe für vier Konzept-Felder vor. Antworte NUR mit JSON: {"wasFuerWen":"","kernFunktionen":"","nutzerDaten":"","verkauf":""}. Jeder Wert 1–2 Sätze, deutsch, konkret aber als Vorschlag formuliert. Erfinde nichts Unplausibles.`
  let suggestions = { wasFuerWen: '', kernFunktionen: '', nutzerDaten: '', verkauf: '' }
  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system,
      prompt: data.seed,
      maxOutputTokens: 700,
    })
    const m = text.match(/\{[\s\S]*\}/)
    if (m) suggestions = { ...suggestions, ...JSON.parse(m[0]) }
  } catch (err) {
    logger.warn('concept suggest LLM failed', { message: err instanceof Error ? err.message : 'unknown' })
  }
  return NextResponse.json({ suggestions })
})
