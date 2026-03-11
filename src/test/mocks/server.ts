import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  // OpenAI direkt (Streaming — SSE)
  http.post('https://api.openai.com/v1/chat/completions', () =>
    HttpResponse.json({
      id: 'mock-completion',
      choices: [{ message: { role: 'assistant', content: 'Mock' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      model: 'gpt-4o-mini',
    })
  ),

  // OpenAI via Helicone Proxy (falls später verwendet)
  http.post('https://oai.helicone.ai/v1/chat/completions', () =>
    HttpResponse.json({
      id: 'mock-completion',
      choices: [{ message: { role: 'assistant', content: 'Mock' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      model: 'gpt-4o-mini',
    })
  ),

  // Supabase REST API
  http.get('*/rest/v1/qa_routing_log', () =>
    HttpResponse.json([])
  ),
  http.post('*/rest/v1/qa_routing_log', () =>
    HttpResponse.json({ id: 'mock-uuid' }, { status: 201 })
  ),
]

export const server = setupServer(...handlers)
