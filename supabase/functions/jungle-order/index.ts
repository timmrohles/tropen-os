import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Dify Workflow aufrufen (blocking) ────────────────────────────────────────
async function callDify(prompt: string, apiKey: string): Promise<string> {
  const difyUrl = Deno.env.get('DIFY_API_URL') ?? 'https://api.dify.ai/v1'
  const res = await fetch(`${difyUrl}/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: { prompt },
      response_mode: 'blocking',
      user: 'jungle-order',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Dify error ${res.status}: ${err}`)
  }
  const data = await res.json()
  // Dify Workflow gibt Outputs als data.data.outputs zurück
  const outputs = data?.data?.outputs
  return outputs?.text ?? outputs?.result ?? JSON.stringify(outputs)
}

// ── JSON sicher aus LLM-Antwort extrahieren ─────────────────────────────────
function extractJson(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/)
  const raw = match ? match[1] ?? match[0] : text
  return JSON.parse(raw.trim())
}

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json() as {
      action: 'structure' | 'merge'
      conversations?: Array<{ id: string; title: string | null; task_type: string | null; project_id: string | null }>
      conversation_ids?: string[]
    }

    const apiKey = Deno.env.get('DIFY_JUNGLE_ORDER_KEY')
    if (!apiKey) throw new Error('DIFY_JUNGLE_ORDER_KEY nicht konfiguriert')

    // ── Modus A: structure ───────────────────────────────────────────────────
    if (body.action === 'structure') {
      if (!body.conversations?.length) {
        return new Response(JSON.stringify({ error: 'Keine Conversations übergeben' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const convJson = JSON.stringify(
        body.conversations.map((c) => ({ id: c.id, title: c.title ?? 'Unterhaltung', task_type: c.task_type }))
      )

      const prompt = `Du bist Toro, ein KI-Papagei der durch den Informationsdschungel führt.

Analysiere diese Chat-Liste und schlage eine sinnvolle Projektstruktur vor.

Chats:
${convJson}

Regeln:
- Maximal 6 Projektordner
- Mindestens 2 Chats pro Ordner
- Projektnamen kurz und prägnant (max 3 Wörter)
- Jeder Chat wird genau einem Ordner zugewiesen
- Nicht zuordenbare Chats kommen in "Sonstiges"

Antworte NUR mit validem JSON (kein Markdown drumherum):
{
  "projects": [
    {
      "name": "Projektname",
      "emoji": "passendes Emoji",
      "conversations": ["id1", "id2"],
      "reason": "Ein Satz warum diese Chats zusammengehören"
    }
  ],
  "summary": "Ein Satz was Toro erkannt hat",
  "media_hint": false
}`

      const raw = await callDify(prompt, apiKey)
      const result = extractJson(raw)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Modus B: merge ───────────────────────────────────────────────────────
    if (body.action === 'merge') {
      if (!body.conversation_ids?.length || body.conversation_ids.length < 2) {
        return new Response(JSON.stringify({ error: 'Mindestens 2 Conversations nötig' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Service-Role-Client für DB-Zugriff
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Conversations + Messages laden
      const { data: convs } = await adminClient
        .from('conversations')
        .select('id, title')
        .in('id', body.conversation_ids)

      const { data: messages } = await adminClient
        .from('messages')
        .select('conversation_id, role, content, created_at')
        .in('conversation_id', body.conversation_ids)
        .order('created_at')

      // Conversations mit Messages anreichern
      const convData = (convs ?? []).map((c) => ({
        title: c.title ?? 'Unterhaltung',
        messages: (messages ?? [])
          .filter((m) => m.conversation_id === c.id)
          .map((m) => `${m.role === 'user' ? 'User' : 'Toro'}: ${m.content}`)
          .join('\n'),
      }))

      const count = convData.length
      const convJson = JSON.stringify(convData)

      const prompt = `Du bist Toro. Fasse diese ${count} Unterhaltungen zu einer kohärenten Zusammenfassung zusammen.

Unterhaltungen:
${convJson}

Erstelle:
1. Einen prägnanten Titel (max 6 Wörter)
2. Eine strukturierte Zusammenfassung mit den wichtigsten Erkenntnissen, Entscheidungen und offenen Punkten
3. Einen "Nächste Schritte" Abschnitt falls relevant

Format: Markdown
Ton: wie Toro – klar, strukturiert, kein Rauschen

Antworte NUR mit validem JSON:
{
  "title": "Zusammengefasster Titel",
  "content": "## Kernerkenntnisse\\n\\n...",
  "source_count": ${count}
}`

      const raw = await callDify(prompt, apiKey)
      const result = extractJson(raw)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unbekannte action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[jungle-order]', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
