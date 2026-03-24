// supabase/functions/ai-chat/index.ts
// Tropen OS v3 – Multi-Provider AI Chat (Anthropic / OpenAI)
//
// Pipeline: Auth → Task-Router → Model-Routing → Budget → History → Knowledge → LLM → Stream

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────
// Typen
// ─────────────────────────────────────────

type TaskType   = "chat" | "summarize" | "extract" | "research" | "create";
type Agent      = "general" | "knowledge" | "content" | "business";
type ModelClass = "fast" | "deep" | "safe";
type Provider   = "anthropic" | "openai" | "mistral" | "google";

interface WorkflowPlanParam {
  api_model_id:  string;   // e.g. "claude-sonnet-4-20250514"
  provider:      string;   // "anthropic" | "openai"
  system_prompt: string;   // merged capability + outcome prompt
}

interface AttachmentParam {
  name:      string;
  mediaType: string;  // e.g. "image/jpeg" | "application/pdf"
  base64:    string;
}

interface ChatRequest {
  workspace_id:    string;
  conversation_id: string;
  message:         string;
  agent_id?:       string;
  workflow_plan?:  WorkflowPlanParam;  // pre-resolved via /api/capabilities/resolve
  attachment?:     AttachmentParam;
}

interface TaskRouterResult {
  task_type:   TaskType;
  agent:       Agent;
  model_class: ModelClass;
}

interface HistoryMsg { role: "user" | "assistant"; content: string }

// ─────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY    = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const OPENAI_API_KEY       = Deno.env.get("OPENAI_API_KEY") ?? "";

// ─────────────────────────────────────────
// Task-Router: Keyword-Matching
// ─────────────────────────────────────────

function detectTask(message: string): TaskRouterResult {
  const msg = message.toLowerCase();

  let task_type: TaskType = "chat";
  if (/zusammenfass|summar|tl;dr|kürz|überblick/i.test(msg))                task_type = "summarize";
  else if (/extrahier|extract|liste alle|finde alle|zähle|auflist/i.test(msg)) task_type = "extract";
  else if (/recherchier|research|analysier|vergleich|markt|wettbewerb/i.test(msg)) task_type = "research";
  else if (/schreib|erstell|generier|entwurf|kreier|verfass|formulier/i.test(msg)) task_type = "create";

  let agent: Agent = "general";
  if (/dokument|pdf|artikel|text|bericht|protokoll|notiz/i.test(msg))       agent = "knowledge";
  else if (/email|brief|angebot|präsentation|vorlage|newsletter/i.test(msg)) agent = "content";
  else if (/rechnung|vertrag|lieferant|kunde|umsatz|kosten|budget|projekt/i.test(msg)) agent = "business";

  let model_class: ModelClass = "fast";
  if (task_type === "research" || task_type === "create") model_class = "deep";
  if (/vertraulich|dsgvo|sensitiv|personenbezogen|geheim|confidential/i.test(msg)) model_class = "safe";

  return { task_type, agent, model_class };
}

// ─────────────────────────────────────────
// System-Prompt Builder
// ─────────────────────────────────────────

function buildSystemPrompt(p: {
  aiGuideName:          string;
  taskType:             string;
  agent:                string;
  chatStyle:            string;
  proactiveHints:       boolean;
  thinkingMode:         boolean;
  agentSystemPrompt:    string | null;
  workflowSystemPrompt: string | null;
  projectContext:       string | null;
  projectMemory:        string | null;
  knowledgeContext:     string;
}): string {
  const lines: string[] = [];

  // ── Gesprächsregeln (Pflicht — immer einhalten) ──────────────────────────
  lines.push(`## Gesprächsregeln (Pflicht — immer einhalten)`);
  lines.push(`
1. EINE FRAGE AUF EINMAL
   Stelle nie mehr als eine Frage pro Antwort.
   Wenn du mehrere Dinge wissen musst: fange mit der wichtigsten an.
   Die anderen Fragen kommen nach der Antwort des Users.

2. BEI ERSTELLUNGS-ANFRAGEN: ERST FRAGEN, DANN BAUEN
   Wenn der User sagt "erstelle", "mach", "bau", "generier", "schreib" ohne ausreichend Details — EINE kurze Frage stellen, dann warten.
   Erst wenn der User geantwortet hat und klar ist was gewünscht wird, bauen.

   FRAGT zuerst (Details fehlen):
   "erstelle mir ein Dashboard" → "Welche Daten soll das Dashboard zeigen — Marketing, Finanzen oder etwas anderes?"
   "schreib einen Bericht" → "Über welches Thema und für welche Zielgruppe?"
   "mach eine Präsentation" → "Zu welchem Thema — und ungefähr wie viele Slides?"
   "erstelle einen Agenten" → "Was soll der Agent tun — automatisch überwachen, zusammenfassen oder etwas anderes?"

   STARTET DIREKT (genug Details vorhanden):
   "schreib einen Tweet über unser neues Feature-Launch" → sofort schreiben
   "erstelle eine Zusammenfassung dieser Konversation" → sofort erstellen
   "generier 3 Ideen für einen Newsletter zum Thema KI im Marketing" → sofort generieren
   "erkläre mir den Unterschied zwischen X und Y" → sofort erklären

   Niemals: raten und sofort bauen ohne Kontext.

3. DIREKT STARTEN NUR WENN DETAILS VORHANDEN
   Sofort loslegen wenn:
   - Thema + Inhalt + Zweck klar sind (auch aus dem Kontext oder Gesprächsverlauf)
   - Die Anfrage eine einfache Frage oder Erklärung ist
   - Die Anfrage eine direkte Weiterführung des vorherigen Gesprächs ist
   - Der User explizit "einfach machen" oder "ohne viel Fragen" signalisiert
   Eine Frage stellen wenn Typ, Inhalt oder Zweck unklar ist.

4. KEIN FORMULAR-STIL
   Keine nummerierten Fragenlisten.
   Keine Kategorien wie "1. Zweck 2. Daten 3. Benutzer".
   Gespräch, nicht Intake-Formular — eine Frage, dann warten.

5. KURZE ERSTE ANTWORT
   Die erste Antwort auf eine neue Anfrage ist kurz:
   Entweder eine einzelne Klärungsfrage ODER direkt loslegen wenn alles klar ist.
   Nie mehrere Fragen auf einmal.

6. MARKDOWN NUR WENN SINNVOLL
   Überschriften und Listen nur bei langen strukturierten Inhalten.
   Für Gespräche: normaler Fließtext.
`);

  // ── Interaktive Artifacts ─────────────────────────────────────────────────
  lines.push(`## Interaktive Artifacts

Wenn eine Antwort von einer interaktiven Darstellung profitiert, generiere ein Artifact statt einer Markdown-Tabelle.

Format:
<artifact type="react" name="[Kurzer Titel]">
[React-Code hier — KEIN export default, KEIN import]
[React und ReactDOM sind global verfügbar]
[Komponente heißt immer: function App()]
</artifact>

PFLICHT-REGELN für jeden Artifact-Code:
- Schreibe "function App() {" — KEIN "export default function App()"
- KEIN import, KEIN export — React ist als globale Variable verfügbar
- Echte React-Komponente mit React.useState() für Interaktivität
- Nur Inline-Styles — kein Tailwind, kein CSS, keine externen Libraries
- KEINE Markdown-Syntax im JSX (kein #, kein -, kein **)
- Mindestens ein interaktives Element (Tab, Filter, Klick, Toggle)
- Daten als const-Arrays direkt im Code

Für KPI-Dashboards: Grid mit Kacheln
Für Vergleiche: echte <table><thead><tbody> Tags
Für Berichte: Tabs mit React.useState für aktiven Tab

Wann Artifact verwenden:
- Dashboards, KPI-Übersichten, Kennzahlen
- Tabellen mit mehr als 3 Zeilen
- Vergleichsmatrizen
- Finanzübersichten mit Zahlen
- Schritt-für-Schritt-Pläne mit klickbaren Checkboxen

Nach einem Artifact: maximal 1 kurzer Satz oder gar nichts.
Das Artifact erklärt sich selbst. Kein Aufzählen was drin ist.

Wann KEIN Artifact:
- Einfache Listen oder kurze Texte
- Definitionen
- Gespräche ohne strukturierte Daten

## Präsentations-Artifacts

Wenn der User eine Präsentation, Slides, einen Pitch oder eine Slideshow möchte:

<artifact type="presentation" title="[Titel der Präsentation]" slides="[Anzahl]">
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css">
  <style>
    :root { --r-heading-color: #1A1714; --r-link-color: #2D7A50; --r-background-color: #EAE9E5; }
    .reveal h1, .reveal h2 { color: #1A1714; }
    .reveal li { color: #4A4540; line-height: 1.7; }
    .reveal p { color: #4A4540; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section><h1>[Titel]</h1><p>[Untertitel]</p></section>
      <section><h2>[Slide 2]</h2><ul><li>[Punkt 1]</li><li>[Punkt 2]</li></ul></section>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
  <script>
    Reveal.initialize({ hash: true, controls: true, progress: true })
    Reveal.on('slidechanged', (e) => {
      window.parent.postMessage({ type: 'slide-changed', indexh: e.indexh, total: Reveal.getTotalSlides() }, '*')
    })
  </script>
</body>
</html>
</artifact>

PFLICHT-REGELN für Präsentations-Artifacts:
- Slide 1: immer Titel + Untertitel
- Max. 8 Slides (außer User wünscht explizit mehr)
- Pro Slide: max. 5 Bullet-Points
- Letzte Slide: Zusammenfassung oder CTA
- Nur Design-Tokens: --r-heading-color: #1A1714, --r-background-color: #EAE9E5, --r-link-color: #2D7A50
- Keine externen Bilder oder Fonts — nur Reveal.js CDN
- slides="N" Attribut immer korrekt setzen (Anzahl der <section> Tags)
- Kein React, kein JSX — reines HTML

Beispiel KPI-Dashboard:
<artifact type="react" name="Marketing Dashboard">
const kpis = [
  { label: "Reichweite", value: "24.500", trend: "+12%" },
  { label: "Conversions", value: "342", trend: "+8%" },
  { label: "Kosten/Lead", value: "€4,20", trend: "-3%" },
]
const tableData = [
  { kanal: "Google Ads", budget: 1200, leads: 156, cpl: 7.69 },
  { kanal: "Instagram", budget: 800, leads: 98, cpl: 8.16 },
  { kanal: "LinkedIn", budget: 600, leads: 88, cpl: 6.82 },
]
function App() {
  const [aktiv, setAktiv] = React.useState("alle")
  const gefiltert = aktiv === "alle" ? tableData : tableData.filter(r => r.kanal.toLowerCase().includes(aktiv))
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>{k.trend}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["alle", "google", "instagram", "linkedin"].map(f => (
          <button key={f} onClick={() => setAktiv(f)} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #e5e7eb", background: aktiv === f ? "#16a34a" : "#fff", color: aktiv === f ? "#fff" : "#374151", cursor: "pointer", fontSize: 13 }}>{f}</button>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr>{["Kanal","Budget","Leads","CPL"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #e5e7eb", color: "#374151" }}>{h}</th>)}</tr></thead>
        <tbody>{gefiltert.map(r => (
          <tr key={r.kanal} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={{ padding: "8px 10px" }}>{r.kanal}</td>
            <td style={{ padding: "8px 10px" }}>€{r.budget}</td>
            <td style={{ padding: "8px 10px" }}>{r.leads}</td>
            <td style={{ padding: "8px 10px" }}>€{r.cpl.toFixed(2)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
</artifact>
`);

  lines.push(`Du bist ${p.aiGuideName}, ein intelligenter KI-Arbeitsassistent.`);
  lines.push(`Antworte auf Deutsch, präzise und professionell.`);
  lines.push(`Kennzeichne Unsicherheiten explizit. Du bist ein KI-System – weise darauf hin wenn relevant.`);

  if (p.chatStyle === "clear" || p.chatStyle === "concise" || p.chatStyle === "kompakt")
    lines.push("Antworte knapp und direkt – kein Fülltext, maximal 3–4 Sätze wenn möglich.");
  else if (p.chatStyle === "detailed" || p.chatStyle === "ausführlich")
    lines.push("Antworte ausführlich mit klaren Abschnitten, Beispielen und Erklärungen.");
  else if (p.chatStyle === "kreativ")
    lines.push("Antworte kreativ und experimentell. Nutze Metaphern und unerwartete Analogien.");
  else
    lines.push("Antworte strukturiert mit Markdown wenn sinnvoll.");

  if (p.proactiveHints) lines.push('Schlage am Ende jeder Antwort 1–2 konkrete nächste Schritte vor, wenn sinnvoll. Format: "💡 Als nächstes könntest du: [Vorschlag]". Nicht bei einfachen Faktenfragen.');
  if (p.thinkingMode)   lines.push("Erkläre deinen Denkprozess Schritt für Schritt bevor du antwortest.");

  if (p.workflowSystemPrompt) {
    lines.push("\n## Capability-Kontext");
    lines.push(p.workflowSystemPrompt);
  }

  if (p.agentSystemPrompt) {
    lines.push("\n## Spezialisierung");
    lines.push(p.agentSystemPrompt);
  }

  if (p.projectContext) {
    lines.push("\n## Projekt-Kontext");
    lines.push(p.projectContext);
  }

  if (p.projectMemory) {
    lines.push("\n## Projekt-Gedächtnis (Erkenntnisse aus früheren Gesprächen)");
    lines.push(p.projectMemory);
  }

  if (p.knowledgeContext) {
    lines.push("\n## Wissensbasis (relevante Dokumente)");
    lines.push(p.knowledgeContext);
    lines.push("\nNutze diese Informationen um die Anfrage zu beantworten. Zitiere die Quelle wenn du Inhalte daraus verwendest.");
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

function calculateCost(tokensIn: number, tokensOut: number, costIn: number, costOut: number): number {
  return Math.round(((tokensIn / 1000) * costIn + (tokensOut / 1000) * costOut) * 10000) / 10000;
}

/** Approximate token count: ~4 chars per token (conservative for German text) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function hashUserId(userId: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

// ─────────────────────────────────────────
// Provider API Calls
// ─────────────────────────────────────────

function callAnthropic(apiModelId: string, systemPrompt: string, history: HistoryMsg[], userMessage: string, attachment?: AttachmentParam, webSearchEnabled = false) {
  // Build user content: multi-part when attachment present, plain string otherwise
  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
    | { type: "document"; source: { type: "base64"; media_type: string; data: string } };

  let userContent: string | ContentBlock[];
  if (attachment) {
    const sourceBlock: ContentBlock = attachment.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: attachment.mediaType, data: attachment.base64 } }
      : { type: "image",    source: { type: "base64", media_type: attachment.mediaType, data: attachment.base64 } };
    userContent = [sourceBlock, { type: "text", text: userMessage }];
  } else {
    userContent = userMessage;
  }

  const messages = [...history, { role: "user", content: userContent }];
  const headers: Record<string, string> = {
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  if (webSearchEnabled) {
    headers["anthropic-beta"] = "web-search-2025-03-05";
  }
  const tools = webSearchEnabled
    ? [{ type: "web_search_20260209", name: "web_search" }]
    : undefined;

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({ model: apiModelId, max_tokens: 4096, system: systemPrompt, messages, stream: true, ...(tools ? { tools } : {}) }),
  });
}

function callOpenAI(apiModelId: string, systemPrompt: string, history: HistoryMsg[], userMessage: string) {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: apiModelId, messages, stream: true, stream_options: { include_usage: true } }),
  });
}

// ─────────────────────────────────────────
// Stream-Parser pro Provider
// ─────────────────────────────────────────

interface WebSearchResult { url: string; title: string; page_age?: string }

async function streamAnthropic(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  send: (obj: Record<string, unknown>) => void
): Promise<{ tokensIn: number; tokensOut: number; fullAnswer: string; sources: WebSearchResult[] }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";
  let tokensIn = 0;
  let tokensOut = 0;
  const sources: WebSearchResult[] = [];
  let searchStarted = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(raw); } catch { continue; }

      const type = parsed.type as string;

      if (type === "content_block_start") {
        const block = parsed.content_block as Record<string, unknown> | undefined;
        const blockType = block?.type as string | undefined;

        // Web search tool invocation
        if ((blockType === "server_tool_use" || blockType === "tool_use") &&
            (block?.name as string) === "web_search" && !searchStarted) {
          searchStarted = true;
          send({ type: "searching" });
        }

        // Web search results — collect sources
        if (blockType === "tool_result" || blockType === "web_search_tool_result") {
          const content = block?.content as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(content)) {
            for (const item of content) {
              if (item.type === "web_search_result" && item.url) {
                sources.push({
                  url:      item.url as string,
                  title:    (item.title as string) || (item.url as string),
                  page_age: item.page_age as string | undefined,
                });
              }
            }
          }
        }
      } else if (type === "content_block_delta") {
        const delta = parsed.delta as { type?: string; text?: string } | undefined;
        if (delta?.type === "text_delta" && delta.text) {
          fullAnswer += delta.text;
          send({ type: "chunk", content: delta.text });
        }
      } else if (type === "message_start") {
        const usage = (parsed.message as { usage?: { input_tokens?: number } } | undefined)?.usage;
        tokensIn = usage?.input_tokens ?? 0;
      } else if (type === "message_delta") {
        const usage = (parsed.usage as { output_tokens?: number } | undefined);
        tokensOut = usage?.output_tokens ?? 0;
      }
    }
  }
  return { tokensIn, tokensOut, fullAnswer, sources };
}

async function streamOpenAI(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  send: (obj: Record<string, unknown>) => void
): Promise<{ tokensIn: number; tokensOut: number; fullAnswer: string }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";
  let tokensIn = 0;
  let tokensOut = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(raw); } catch { continue; }

      const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined;
      const chunk = choices?.[0]?.delta?.content;
      if (chunk) {
        fullAnswer += chunk;
        send({ type: "chunk", content: chunk });
      }

      const usage = parsed.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
      if (usage) {
        tokensIn  = usage.prompt_tokens    ?? tokensIn;
        tokensOut = usage.completion_tokens ?? tokensOut;
      }
    }
  }
  return { tokensIn, tokensOut, fullAnswer };
}

// ─────────────────────────────────────────
// Art. 12 KI-Logging
// ─────────────────────────────────────────

function logRouting(
  supabase: ReturnType<typeof createClient>,
  entry: {
    task_type: string; model_selected: string; routing_reason: string;
    latency_ms: number | null; status: "success" | "error";
    error_message?: string; user_id_hashed: string | null;
  }
): void {
  supabase.from("qa_routing_log").insert({
    task_type:      entry.task_type,
    model_selected: entry.model_selected,
    routing_reason: entry.routing_reason,
    latency_ms:     entry.latency_ms,
    status:         entry.status,
    error_message:  entry.error_message ?? null,
    user_id:        entry.user_id_hashed,
  }).then(({ error }) => {
    if (error) console.warn("[qa_routing_log] insert fehlgeschlagen:", error.message);
  });
}

// ─────────────────────────────────────────
// Hauptlogik
// ─────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  try {
    const requestStart = Date.now();

    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Nicht autorisiert", 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) return errorResponse("Ungültiger Token", 401);

    // 2. Body
    const body: ChatRequest = await req.json();
    const { workspace_id, conversation_id, message, agent_id, attachment } = body;
    if (!workspace_id || !conversation_id || !message) return errorResponse("Fehlende Parameter");

    // 3. Task-Router
    const { task_type, agent, model_class } = detectTask(message);

    // 4. User-Profil
    const { data: userProfile, error: profileError } = await supabase
      .from("users").select("*, organizations(*)").eq("id", user.id).single();
    if (profileError || !userProfile) return errorResponse("User nicht gefunden", 404);
    if (!userProfile.is_active) return errorResponse("Account deaktiviert", 403);
    const organization = userProfile.organizations as { budget_limit: number | null };

    // 5. Präferenzen + Org-Settings
    const [{ data: userPrefs }, { data: orgSettings }] = await Promise.all([
      supabase.from("user_preferences").select("chat_style, memory_window, proactive_hints, thinking_mode, web_search_enabled, link_previews").eq("user_id", user.id).maybeSingle(),
      supabase.from("organization_settings").select("ai_guide_name").eq("organization_id", userProfile.organization_id).maybeSingle(),
    ]);
    const chatStyle        = userPrefs?.chat_style        ?? "structured";
    const memorySize       = userPrefs?.memory_window     ?? 20;
    const proactiveHints   = userPrefs?.proactive_hints   ?? true;
    const thinkingMode     = userPrefs?.thinking_mode     ?? false;
    const webSearchEnabled = (userPrefs as { web_search_enabled?: boolean } | null)?.web_search_enabled ?? false;
    const linkPreviews     = (userPrefs as { link_previews?: boolean } | null)?.link_previews ?? true;
    const aiGuideName      = orgSettings?.ai_guide_name   ?? "Toro";

    // 5b. Agent-System-Prompt
    let agentSystemPrompt: string | null = null;
    if (agent_id) {
      const { data: agentData } = await supabase.from("agents").select("system_prompt").eq("id", agent_id).maybeSingle();
      agentSystemPrompt = agentData?.system_prompt ?? null;
    }

    // 6. Workspace-Zugang
    const { data: membership } = await supabase
      .from("department_members").select("role").eq("workspace_id", workspace_id).eq("user_id", user.id).single();
    if (!membership || membership.role === "viewer") return errorResponse("Kein Zugang zu diesem Workspace", 403);

    const { data: workspace, error: wsError } = await supabase
      .from("departments").select("*").eq("id", workspace_id).eq("organization_id", userProfile.organization_id).single();
    if (wsError || !workspace) return errorResponse("Workspace nicht gefunden", 404);

    const allowedClasses: string[] = workspace.allowed_model_classes ?? ["fast"];
    const effectiveClass: ModelClass = allowedClasses.includes(model_class) ? model_class : (allowedClasses[0] as ModelClass);

    // 7. Günstigstes Modell der Klasse
    const { data: models, error: modelError } = await supabase
      .from("model_catalog").select("*").eq("model_class", effectiveClass).eq("is_active", true)
      .order("cost_per_1k_input", { ascending: true }).limit(1);
    if (modelError || !models?.length) return errorResponse(`Kein aktives Modell für Klasse "${effectiveClass}"`, 400);
    const modelData = models[0];
    let provider   = (modelData.provider  as Provider) ?? "anthropic";
    let apiModelId = (modelData.api_model_id as string) ?? (modelData.name as string);

    // 7b. workflow_plan override (pre-resolved via /api/capabilities/resolve)
    const wp = body.workflow_plan;
    if (wp) {
      provider   = wp.provider as Provider;
      apiModelId = wp.api_model_id;
    }

    // 7c. Force Anthropic Claude when web search or thinking mode is active
    const needsAnthropic = webSearchEnabled || thinkingMode;
    if (needsAnthropic && provider !== "anthropic") {
      provider   = "anthropic";
      apiModelId = "claude-sonnet-4-20250514";
    }

    console.log(`Modell: ${apiModelId} (${provider})${wp ? " [workflow_plan]" : ` | Klasse: ${effectiveClass}`}`);

    // 8. Budget-Kontrolle
    const { data: budgetOk, error: budgetError } = await supabase.rpc(
      "check_and_reserve_budget",
      { org_id: userProfile.organization_id, p_workspace_id: workspace_id, estimated_cost: 0.01 }
    );
    if (budgetError) return errorResponse("Budget-Prüfung fehlgeschlagen", 500);
    if (!budgetOk)   return errorResponse("Monatliches Budget erreicht. Bitte Admin kontaktieren.", 402);

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const { data: usageThisMonth } = await supabase.from("usage_logs")
      .select("cost_eur").eq("organization_id", userProfile.organization_id)
      .gte("created_at", startOfMonth.toISOString());
    const totalSpent = usageThisMonth?.reduce((s, r) => s + (r.cost_eur || 0), 0) ?? 0;

    // 9. Konversation + Projekt-Kontext
    const { data: convData, error: convError } = await supabase
      .from("conversations").select("project_id")
      .eq("id", conversation_id).eq("workspace_id", workspace_id).eq("user_id", user.id).single();
    if (convError || !convData) return errorResponse("Unterhaltung nicht gefunden", 404);

    const projectId = (convData as { project_id?: string | null }).project_id ?? null;
    let projectContext: string | null = null;
    let projectMemory: string | null = null;
    if (projectId) {
      const [{ data: projectData }, { data: memoryRows }] = await Promise.all([
        supabase.from("projects")
          .select("instructions").eq("id", projectId).is("deleted_at", null).single(),
        supabase.from("project_memory")
          .select("type, content")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      projectContext = projectData?.instructions ?? null;
      if (memoryRows && memoryRows.length > 0) {
        projectMemory = (memoryRows as { type: string; content: string }[])
          .map(m => `[${m.type}] ${m.content}`)
          .join("\n");
      }
    }

    // 10. Knowledge-Search (inline — kein Edge-zu-Edge-Aufruf)
    const OPENAI_KEY_FOR_EMBED = Deno.env.get("OPENAI_API_KEY")!;
    let knowledgeContext = "";
    try {
      const embRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_KEY_FOR_EMBED}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "text-embedding-3-small", input: message }),
      });
      if (embRes.ok) {
        const embData = await embRes.json() as { data: [{ embedding: number[] }] };
        const embeddingStr = `[${embData.data[0].embedding.join(",")}]`;

        const { data: ksResults } = await supabase.rpc("search_knowledge_chunks", {
          query_embedding:  embeddingStr,
          match_org_id:     userProfile.organization_id,
          match_user_id:    user.id,
          match_project_id: projectId,
          match_threshold:  0.3,
          match_count:      15,
        });

        if (ksResults && ksResults.length > 0) {
          const scored = ksResults.map((r: {
            id: string; content: string; similarity: number;
            document_id: string; user_id: string | null; project_id: string | null;
          }) => ({ ...r, score: r.similarity + (r.project_id ? 0.2 : r.user_id ? 0.1 : 0) }));
          scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
          const topChunks = scored.slice(0, 5);

          const docIds = [...new Set(topChunks.map((c: { document_id: string }) => c.document_id))];
          const { data: docs } = await supabase.from("knowledge_documents")
            .select("id, title, created_at").in("id", docIds);
          const docMap = new Map((docs ?? []).map((d: { id: string; title: string; created_at: string }) => [d.id, d]));

          knowledgeContext = topChunks.map((c: { content: string; document_id: string }, i: number) => {
            const doc = docMap.get(c.document_id) as { title: string; created_at: string } | undefined;
            const citation = doc
              ? `Quelle: ${doc.title} · ${new Date(doc.created_at).toLocaleDateString("de-DE")}`
              : "Quelle: Wissensbasis";
            return `[${i + 1}] ${citation}\n${c.content}`;
          }).join("\n\n");
          console.log(`Knowledge: ${topChunks.length} Chunks gefunden`);
        }
      }
    } catch (ksErr) {
      console.warn("Knowledge-Search fehlgeschlagen (non-blocking):", String(ksErr));
    }

    // 11. Konversations-History laden
    const { data: historyRows } = await supabase
      .from("messages").select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(memorySize);
    const history: HistoryMsg[] = (historyRows ?? []).map((r: { role: string; content: string }) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    // 12. User-Nachricht speichern
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id, role: "user", content: message,
      model_used: modelData.name, task_type, agent, model_class: effectiveClass,
    });
    if (msgError) return errorResponse("Nachricht konnte nicht gespeichert werden", 500);

    // 13. System-Prompt bauen
    const systemPrompt = buildSystemPrompt({
      aiGuideName, taskType: task_type, agent, chatStyle,
      proactiveHints, thinkingMode, agentSystemPrompt,
      workflowSystemPrompt: wp?.system_prompt ?? null,
      projectContext, projectMemory, knowledgeContext,
    });

    // 13b. Memory-Warnung: approximierter Kontext-Verbrauch
    const contextWindow = (modelData.context_window as number | null) ?? 200000;
    const historyText = history.map(m => m.content).join(" ");
    const approxTokensUsed =
      estimateTokens(systemPrompt) +
      estimateTokens(historyText) +
      estimateTokens(message);
    const memoryUsageRatio = approxTokensUsed / contextWindow;
    const memoryWarning = memoryUsageRatio > 0.85;

    // 14. LLM aufrufen
    console.log(`LLM Call: ${provider}/${apiModelId}`);
    let llmResponse: Response;
    if (provider === "anthropic") {
      llmResponse = await callAnthropic(apiModelId, systemPrompt, history, message, attachment, webSearchEnabled);
    } else if (provider === "openai") {
      llmResponse = await callOpenAI(apiModelId, systemPrompt, history, message);
    } else {
      return errorResponse(`Provider "${provider}" wird noch nicht unterstützt.`, 400);
    }

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error(`${provider} Fehler ${llmResponse.status}:`, errText.slice(0, 300));
      return errorResponse(`LLM-Fehler (${provider} HTTP ${llmResponse.status}): ${errText.slice(0, 200)}`, 502);
    }

    // 15. SSE-Stream aufbauen
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(obj: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        }

        const reader = llmResponse.body!.getReader();
        const hashedUserId = await hashUserId(user.id);

        try {
          let tokensIn = 0, tokensOut = 0, fullAnswer = "";
          let sources: WebSearchResult[] = [];

          if (provider === "anthropic") {
            ({ tokensIn, tokensOut, fullAnswer, sources } = await streamAnthropic(reader, send));
          } else {
            ({ tokensIn, tokensOut, fullAnswer } = await streamOpenAI(reader, send));
          }

          const costEur = calculateCost(tokensIn, tokensOut, modelData.cost_per_1k_input, modelData.cost_per_1k_output);

          // Antwort + Usage speichern
          await supabase.from("messages").insert({
            conversation_id, role: "assistant", content: fullAnswer,
            model_used: modelData.name, task_type, agent, model_class: effectiveClass,
            tokens_input: tokensIn, tokens_output: tokensOut, cost_eur: costEur,
          });
          await supabase.from("usage_logs").insert({
            organization_id: userProfile.organization_id, workspace_id,
            user_id: user.id, model_id: modelData.id, task_type, agent,
            model_class: effectiveClass, tokens_input: tokensIn, tokens_output: tokensOut, cost_eur: costEur,
          });

          send({
            type: "done",
            routing: { task_type, agent, model_class: effectiveClass, model: apiModelId },
            usage: { tokens_input: tokensIn, tokens_output: tokensOut, cost_eur: costEur },
            budget: {
              spent_this_month: Math.round((totalSpent + costEur) * 100) / 100,
              limit: organization.budget_limit ?? null,
            },
            memory_warning:      memoryWarning,
            memory_usage_ratio:  Math.round(memoryUsageRatio * 100) / 100,
            link_previews:       linkPreviews,
            ...(sources.length > 0 ? { sources } : {}),
          });

          logRouting(supabase, {
            task_type, model_selected: modelData.name,
            routing_reason: `${effectiveClass}/${agent}/${provider}`,
            latency_ms: Date.now() - requestStart, status: "success",
            user_id_hashed: hashedUserId,
          });

        } catch (err) {
          console.error("Stream-Fehler:", err);
          send({ type: "error", message: String(err) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    console.error("Unerwarteter Fehler:", err);
    const supabaseForLog = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    logRouting(supabaseForLog, {
      task_type: "unknown", model_selected: "unknown", routing_reason: "error",
      latency_ms: null, status: "error",
      error_message: String(err).slice(0, 500), user_id_hashed: null,
    });
    return errorResponse("Interner Serverfehler", 500);
  }
});
