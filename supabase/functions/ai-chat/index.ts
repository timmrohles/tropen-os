// supabase/functions/ai-chat/index.ts
// Tropen OS v2 – AI Chat Edge Function mit Task-Router + Streaming
//
// Pipeline: Anfrage → Task-Erkennung → Agent → Policy Check → Modellklasse → Modell → Dify Chatflow SSE → Stream
// Dify App: tropen-os-chat-v2 (Chatflow, nicht Workflow)
// Endpoint: /v1/chat-messages

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────
// Typen
// ─────────────────────────────────────────

type TaskType = "chat" | "summarize" | "extract" | "research" | "create";
type Agent = "general" | "knowledge" | "content" | "business";
type ModelClass = "fast" | "deep" | "safe";

interface ChatRequest {
  workspace_id: string;
  conversation_id: string;
  message: string;
  agent_id?: string;
}

interface TaskRouterResult {
  task_type: TaskType;
  agent: Agent;
  model_class: ModelClass;
}

// ─────────────────────────────────────────
// Task-Router: Keyword-Matching
// ─────────────────────────────────────────

function detectTask(message: string): TaskRouterResult {
  const msg = message.toLowerCase();

  let task_type: TaskType = "chat";
  if (/zusammenfass|summar|tl;dr|kürz|überblick/i.test(msg))              task_type = "summarize";
  else if (/extrahier|extract|liste alle|finde alle|zähle|auflist/i.test(msg)) task_type = "extract";
  else if (/recherchier|research|analysier|vergleich|markt|wettbewerb/i.test(msg)) task_type = "research";
  else if (/schreib|erstell|generier|entwurf|kreier|verfass|formulier/i.test(msg)) task_type = "create";

  let agent: Agent = "general";
  if (/dokument|pdf|artikel|text|bericht|protokoll|notiz/i.test(msg))      agent = "knowledge";
  else if (/email|brief|angebot|präsentation|vorlage|newsletter/i.test(msg)) agent = "content";
  else if (/rechnung|vertrag|lieferant|kunde|umsatz|kosten|budget|projekt/i.test(msg)) agent = "business";

  let model_class: ModelClass = "fast";
  if (task_type === "research" || task_type === "create") model_class = "deep";
  if (/vertraulich|dsgvo|sensitiv|personenbezogen|geheim|confidential/i.test(msg)) model_class = "safe";

  return { task_type, agent, model_class };
}

// ─────────────────────────────────────────
// Art. 12 KI-Logging (DSGVO-konform)
// ─────────────────────────────────────────

async function hashUserId(userId: string): Promise<string> {
  const data = new TextEncoder().encode(userId);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function logRouting(
  supabase: ReturnType<typeof createClient>,
  entry: {
    task_type: string;
    model_selected: string;
    routing_reason: string;
    latency_ms: number | null;
    status: "success" | "error";
    error_message?: string;
    user_id_hashed: string | null;
  }
): void {
  // Fire-and-forget — darf nie den Request blockieren
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
// Konstanten
// ─────────────────────────────────────────

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DIFY_API_URL        = (Deno.env.get("DIFY_API_URL") ?? "").trim();
const DIFY_API_KEY        = (Deno.env.get("DIFY_API_KEY") ?? "").trim();  // Key der Chatflow-App tropen-os-chat-v2

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

function calculateCost(
  tokensInput: number,
  tokensOutput: number,
  costPer1kInput: number,
  costPer1kOutput: number
): number {
  return Math.round(
    ((tokensInput / 1000) * costPer1kInput + (tokensOutput / 1000) * costPer1kOutput) * 10000
  ) / 10000;
}

// ─────────────────────────────────────────
// Hauptlogik
// ─────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

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

    // 2. Request Body
    console.log("Step 2: Body parsen");
    const body: ChatRequest = await req.json();
    const { workspace_id, conversation_id, message, agent_id } = body;
    if (!workspace_id || !conversation_id || !message) {
      return errorResponse("Fehlende Parameter");
    }

    // 3. Task-Router
    console.log("Step 3: Task-Router");
    const { task_type, agent, model_class } = detectTask(message);

    // 4. User-Profil + Organisation
    console.log("Step 4: User-Profil laden");
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*, organizations(*)")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) return errorResponse("User nicht gefunden", 404);
    if (!userProfile.is_active) return errorResponse("Account deaktiviert", 403);

    const organization = userProfile.organizations as { budget_limit: number | null };

    // 5. User-Präferenzen + Org-Einstellungen laden
    console.log("Step 5: User-Präferenzen laden");
    const [{ data: userPrefs }, { data: orgSettings }] = await Promise.all([
      supabase
        .from("user_preferences")
        .select("chat_style, memory_window, proactive_hints, thinking_mode")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("organization_settings")
        .select("ai_guide_name")
        .eq("organization_id", userProfile.organization_id)
        .maybeSingle(),
    ]);

    const chatStyle      = userPrefs?.chat_style      ?? "structured";
    const memorySize     = userPrefs?.memory_window   ?? 20;
    const proactiveHints = userPrefs?.proactive_hints ?? true;
    const thinkingMode   = userPrefs?.thinking_mode   ?? false;
    const aiGuideName    = orgSettings?.ai_guide_name ?? "Toro";

    // 5b. Agent-System-Prompt laden (wenn agent_id übergeben)
    let agentSystemPrompt: string | null = null;
    if (agent_id) {
      const { data: agentData } = await supabase
        .from("agents")
        .select("system_prompt, name")
        .eq("id", agent_id)
        .maybeSingle();
      agentSystemPrompt = agentData?.system_prompt ?? null;
    }

    // 6. Workspace-Zugang + Policy Check
    console.log("Step 6: Workspace-Zugang prüfen");
    const { data: membership } = await supabase
      .from("department_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role === "viewer") {
      return errorResponse("Kein Zugang zu diesem Workspace", 403);
    }

    const { data: workspace, error: wsError } = await supabase
      .from("departments")
      .select("*")
      .eq("id", workspace_id)
      .eq("organization_id", userProfile.organization_id)
      .single();

    if (wsError || !workspace) return errorResponse("Workspace nicht gefunden", 404);

    const allowedClasses: string[] = workspace.allowed_model_classes ?? ["fast"];
    const effectiveClass: ModelClass = allowedClasses.includes(model_class)
      ? model_class
      : (allowedClasses[0] as ModelClass);

    // 7. Günstigstes aktives Modell der Klasse wählen
    console.log("Step 7: Modell wählen, Klasse:", effectiveClass);
    const { data: models, error: modelError } = await supabase
      .from("model_catalog")
      .select("*")
      .eq("model_class", effectiveClass)
      .eq("is_active", true)
      .order("cost_per_1k_input", { ascending: true })
      .limit(1);

    if (modelError || !models?.length) {
      return errorResponse(`Kein aktives Modell für Klasse "${effectiveClass}"`, 400);
    }
    const modelData = models[0];

    // 8. Budget-Kontrolle – atomisch via RPC
    console.log("Step 8: Budget prüfen");
    const estimatedCost = 0.01;
    const { data: budgetOk, error: budgetError } = await supabase.rpc(
      "check_and_reserve_budget",
      { org_id: userProfile.organization_id, p_workspace_id: workspace_id, estimated_cost: estimatedCost }
    );

    if (budgetError) {
      console.error("Budget RPC Fehler:", budgetError);
      return errorResponse("Budget-Prüfung fehlgeschlagen", 500);
    }
    if (!budgetOk) {
      return errorResponse("Monatliches Budget erreicht. Bitte Admin kontaktieren.", 402);
    }

    // Budget-Stand für done-Event
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data: usageThisMonth } = await supabase
      .from("usage_logs")
      .select("cost_eur")
      .eq("organization_id", userProfile.organization_id)
      .gte("created_at", startOfMonth.toISOString());
    const totalSpent = usageThisMonth?.reduce((s, r) => s + (r.cost_eur || 0), 0) ?? 0;

    // 9. dify_conversation_id + project_id laden – mit IDOR-Schutz
    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select("dify_conversation_id, project_id")
      .eq("id", conversation_id)
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (convError || !convData) return errorResponse("Unterhaltung nicht gefunden", 404);

    const difyConversationId = convData.dify_conversation_id ?? null;

    // 9b. Projekt-Kontext laden (instructions = manuelles Kontext-Textfeld, chat-14)
    let projectContext: string | null = null;
    const projectId = (convData as { project_id?: string | null }).project_id ?? null;
    if (projectId) {
      const { data: projectData } = await supabase
        .from("projects")
        .select("instructions")
        .eq("id", projectId)
        .is("deleted_at", null)
        .single();
      projectContext = projectData?.instructions ?? null;
    }

    // 9c. Knowledge-Search: relevante Chunks direkt per RPC + OpenAI (kein Edge-zu-Edge-Aufruf)
    console.log("Step 9c: Knowledge-Search (inline)");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
    const SIMILARITY_THRESHOLD = 0.3;
    const TOP_K = 5;
    let knowledgeContext = "";
    try {
      // 1. Query-Embedding erstellen
      const embRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "text-embedding-3-small", input: message }),
      });
      if (!embRes.ok) throw new Error(`Embedding Fehler: ${embRes.status}`);
      const embData = await embRes.json() as { data: [{ embedding: number[] }] };
      const queryEmbedding = embData.data[0].embedding;
      const embeddingStr = `[${queryEmbedding.join(",")}]`;

      // 2. Chunks per RPC suchen
      const { data: ksResults, error: ksErr } = await supabase.rpc("search_knowledge_chunks", {
        query_embedding:  embeddingStr,
        match_org_id:     userProfile.organization_id,
        match_user_id:    user.id,
        match_project_id: projectId,
        match_threshold:  SIMILARITY_THRESHOLD,
        match_count:      TOP_K * 3,
      });
      if (ksErr) throw new Error(ksErr.message);

      if (ksResults && ksResults.length > 0) {
        // Prioritäts-Scoring: Projekt > User > Org
        const scored = ksResults.map((r: {
          id: string; content: string; similarity: number;
          document_id: string; user_id: string | null; project_id: string | null;
          metadata: Record<string, string>;
        }) => ({
          ...r,
          score: r.similarity + (r.project_id ? 0.2 : r.user_id ? 0.1 : 0),
        }));
        scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
        const topChunks = scored.slice(0, TOP_K);

        // Dokument-Metadaten laden
        const docIds = [...new Set(topChunks.map((c: { document_id: string }) => c.document_id))];
        const { data: docs } = await supabase
          .from("knowledge_documents")
          .select("id, title, created_at")
          .in("id", docIds);
        const docMap = new Map((docs ?? []).map((d: { id: string; title: string; created_at: string }) => [d.id, d]));

        knowledgeContext = topChunks.map((c: { content: string; document_id: string }, i: number) => {
          const doc = docMap.get(c.document_id) as { title: string; created_at: string } | undefined;
          const citation = doc
            ? `Quelle: ${doc.title} · ${new Date(doc.created_at).toLocaleDateString("de-DE")}`
            : "Quelle: Wissensbasis";
          return `[${i + 1}] ${citation}\n${c.content}`;
        }).join("\n\n");

        console.log(`Knowledge-Search: ${topChunks.length} Chunks gefunden`);
      } else {
        console.log("Knowledge-Search: keine relevanten Chunks gefunden");
      }
    } catch (ksErr) {
      console.warn("Knowledge-Search fehlgeschlagen (non-blocking):", String(ksErr));
    }

    // 10. User-Nachricht speichern
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id,
      role: "user",
      content: message,
      model_used: modelData.name,
      task_type,
      agent,
      model_class: effectiveClass,
    });

    if (msgError) return errorResponse("Nachricht konnte nicht gespeichert werden", 500);

    // 11. Dify Chatflow aufrufen – /chat-messages Endpoint
    // conversation_id NUR mitschicken wenn vorhanden (null = neues Gespräch)
    const difyBody: Record<string, unknown> = {
      inputs: {
        task_type,
        agent,
        model_class: effectiveClass,
        chat_style: chatStyle,
        memory_size: memorySize,
        ai_guide_name: aiGuideName,
        proactive_hints: proactiveHints,
        mark_uncertainty: true,
        agent_system_prompt: agentSystemPrompt ?? "",
        project_context: projectContext ?? "",
        knowledge_context: knowledgeContext,
        thinking_mode: thinkingMode,
      },
      // Knowledge-Context direkt in Query injizieren — Dify-Input-Variablen werden
      // nur genutzt wenn sie im System-Prompt referenziert sind; die Query ist immer sichtbar.
      query: knowledgeContext
        ? `[Relevante Wissensbasis-Inhalte]\n${knowledgeContext}\n\n[Anfrage]\n${message}`
        : message,
      response_mode: "streaming",
      user: user.id,
    };
    if (difyConversationId) {
      difyBody.conversation_id = difyConversationId;
    }

    console.log("Dify Request:", {
      conversation_id: difyConversationId,
      knowledgeContextLength: knowledgeContext.length,
      hasKnowledge: knowledgeContext.length > 0,
      queryLength: (difyBody.query as string).length,
      queryPrefix: (difyBody.query as string).slice(0, 80),
    });

    const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(difyBody),
    });

    if (!difyResponse.ok) {
      const difyErrorText = await difyResponse.text();
      console.error("Dify Fehler:", difyResponse.status, difyErrorText.slice(0, 200));
      const isHtml = difyErrorText.trimStart().startsWith("<");
      const difyMsg = isHtml
        ? `Dify nicht erreichbar (HTTP ${difyResponse.status}). Bitte in wenigen Minuten erneut versuchen.`
        : `Dify: ${difyErrorText}`;
      return errorResponse(difyMsg, 502);
    }

    // 12. SSE-Stream aufbauen und an Client weiterleiten
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = difyResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullAnswer = "";
        let streamEnded = false;
        let wfTokens: number | null = null; // Tokens aus workflow_finished, Fallback für message_end

        function send(obj: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        }

        const hashedUserId = await hashUserId(user.id);

        async function commitSave(difyConvId: string, tokensInput: number, tokensOutput: number) {
          const costEur = calculateCost(tokensInput, tokensOutput, modelData.cost_per_1k_input, modelData.cost_per_1k_output);

          if (difyConvId && !difyConversationId) {
            console.log("Speichere dify_conversation_id:", difyConvId);
            await supabase.from("conversations")
              .update({ dify_conversation_id: difyConvId })
              .eq("id", conversation_id);
          }

          await supabase.from("messages").insert({
            conversation_id,
            role: "assistant",
            content: fullAnswer,
            model_used: modelData.name,
            task_type,
            agent,
            model_class: effectiveClass,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            cost_eur: costEur,
          });

          await supabase.from("usage_logs").insert({
            organization_id: userProfile.organization_id,
            workspace_id,
            user_id: user.id,
            model_id: modelData.id,
            task_type,
            agent,
            model_class: effectiveClass,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            cost_eur: costEur,
          });

          send({
            type: "done",
            routing: { task_type, agent, model_class: effectiveClass, model: modelData.name },
            usage: { tokens_input: tokensInput, tokens_output: tokensOutput, cost_eur: costEur },
            budget: {
              spent_this_month: Math.round((totalSpent + costEur) * 100) / 100,
              limit: organization.budget_limit ?? null,
            },
          });

          // Art. 12 KI-VO: Logging des Routing-Entscheids (fire-and-forget)
          logRouting(supabase, {
            task_type,
            model_selected: modelData.name,
            routing_reason: `${effectiveClass}/${agent}`,
            latency_ms: Date.now() - requestStart,
            status: "success",
            user_id_hashed: hashedUserId,
          });
        }

        try {
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
              try { parsed = JSON.parse(raw); }
              catch { continue; }

              // Nur Non-Message-Events loggen (kein Spam durch Chunks)
              if (parsed.event !== "message" && parsed.event !== "text_chunk") {
                console.log("=== NON-CHUNK EVENT ===", parsed.event, JSON.stringify(parsed).slice(0, 500));
              }

              if (parsed.event === "message") {
                // Basic Chat App: Chunk via message event
                const chunk = (parsed.answer as string) ?? "";
                if (chunk) {
                  fullAnswer += chunk;
                  send({ type: "chunk", content: chunk });
                }

              } else if (parsed.event === "text_chunk") {
                // Chatflow: Chunk via text_chunk event
                const chunk = (parsed.data as { text?: string })?.text ?? "";
                if (chunk) {
                  fullAnswer += chunk;
                  send({ type: "chunk", content: chunk });
                }

              } else if (parsed.event === "workflow_finished") {
                // Chatflow: Workflow-internes Abschluss-Event
                // KEIN conversation_id hier – kommt erst in message_end!
                // Nur Tokens und Fallback-Antwort sammeln, KEIN streamEnded setzen.
                const data = parsed.data as { total_tokens?: number; outputs?: { answer?: string } } | undefined;
                wfTokens = data?.total_tokens ?? null;
                if (!fullAnswer && data?.outputs?.answer) {
                  fullAnswer = data.outputs.answer;
                  send({ type: "chunk", content: fullAnswer });
                }
                console.log("workflow_finished: tokens =", wfTokens, "| fullAnswer =", fullAnswer.length, "Zeichen");

              } else if (parsed.event === "message_end" && !streamEnded) {
                // Chatflow-Terminal-Event: enthält conversation_id + usage
                streamEnded = true;
                const streamDifyConvId = (parsed.conversation_id as string) ?? "";
                const usage = (parsed.metadata as { usage?: { prompt_tokens: number; completion_tokens: number } })?.usage;
                const tokensInput  = usage?.prompt_tokens    ?? 0;
                const tokensOutput = usage?.completion_tokens ?? wfTokens ?? 0;
                console.log("message_end (terminal):", { streamDifyConvId, tokensInput, tokensOutput });
                await commitSave(streamDifyConvId, tokensInput, tokensOutput);

              } else if (parsed.event === "error") {
                send({ type: "error", message: (parsed.message as string) ?? "Dify-Fehler" });
              }
            }
          }
        } catch (err) {
          console.error("Stream-Fehler:", err);
          send({ type: "error", message: String(err) });
        } finally {
          // Fallback: Nur workflow_finished empfangen, kein message_end (z.B. Basic Workflow App)
          if (!streamEnded && fullAnswer) {
            console.log("Fallback-Save: kein message_end empfangen, speichere via workflow_finished-Daten");
            await commitSave("", 0, wfTokens ?? 0);
          }
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
    // Best-effort error log (kein user context hier)
    const supabaseForLog = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    logRouting(supabaseForLog, {
      task_type: "unknown",
      model_selected: "unknown",
      routing_reason: "error",
      latency_ms: null,
      status: "error",
      error_message: String(err).slice(0, 500),
      user_id_hashed: null,
    });
    return errorResponse("Interner Serverfehler", 500);
  }
});
