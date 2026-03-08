// supabase/functions/ai-chat/index.ts
// Tropen OS – AI Chat Edge Function
// Verantwortlich für: Modell-Prüfung, Budget-Kontrolle, Dify-Call, Logging

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────
// Typen
// ─────────────────────────────────────────

interface ChatRequest {
  workspace_id: string;
  conversation_id: string;
  message: string;
  model: string; // z.B. "gpt-4o"
}

interface DifyResponse {
  answer: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// ─────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DIFY_API_URL = Deno.env.get("DIFY_API_URL")!; // z.B. https://api.dify.ai/v1
const DIFY_API_KEY = Deno.env.get("DIFY_API_KEY")!;

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

function successResponse(data: object) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

// Kosten berechnen basierend auf model_catalog
function calculateCost(
  tokensInput: number,
  tokensOutput: number,
  costPer1kInput: number,
  costPer1kOutput: number
): number {
  const inputCost = (tokensInput / 1000) * costPer1kInput;
  const outputCost = (tokensOutput / 1000) * costPer1kOutput;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 Dezimalstellen
}

// ─────────────────────────────────────────
// Hauptlogik
// ─────────────────────────────────────────

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    // 1. Auth prüfen – User muss eingeloggt sein
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Nicht autorisiert", 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // User aus JWT ermitteln
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return errorResponse("Ungültiger Token", 401);

    // 2. Request Body parsen
    const body: ChatRequest = await req.json();
    const { workspace_id, conversation_id, message, model } = body;

    if (!workspace_id || !conversation_id || !message || !model) {
      return errorResponse("Fehlende Parameter");
    }

    // 3. User-Profil + Organisation laden
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*, organizations(*)")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) return errorResponse("User nicht gefunden", 404);
    if (!userProfile.is_active) return errorResponse("Account deaktiviert", 403);

    const organization = userProfile.organizations;

    // 4. Workspace-Zugang prüfen
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    // Viewer darf nicht chatten
    if (!membership || membership.role === "viewer") {
      return errorResponse("Kein Zugang zu diesem Workspace", 403);
    }

    // 5. Workspace laden + Modell-Erlaubnis prüfen
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspace_id)
      .eq("organization_id", userProfile.organization_id)
      .single();

    if (wsError || !workspace) return errorResponse("Workspace nicht gefunden", 404);

    // Ist das gewählte Modell für diesen Workspace erlaubt?
    if (!workspace.allowed_models.includes(model)) {
      return errorResponse(`Modell "${model}" ist in diesem Workspace nicht erlaubt`, 403);
    }

    // 6. Modell aus Katalog laden (für Kostenberechnung)
    const { data: modelData, error: modelError } = await supabase
      .from("model_catalog")
      .select("*")
      .eq("name", model)
      .eq("is_active", true)
      .single();

    if (modelError || !modelData) {
      return errorResponse(`Modell "${model}" nicht im Katalog oder deaktiviert`, 400);
    }

    // 7. Budget-Kontrolle – monatliche Kosten prüfen
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageThisMonth } = await supabase
      .from("usage_logs")
      .select("cost_eur")
      .eq("organization_id", userProfile.organization_id)
      .gte("created_at", startOfMonth.toISOString());

    const totalSpentThisMonth = usageThisMonth?.reduce(
      (sum, row) => sum + (row.cost_eur || 0), 0
    ) ?? 0;

    // Organisation-Budget prüfen
    if (
      organization.budget_limit &&
      totalSpentThisMonth >= organization.budget_limit
    ) {
      return errorResponse(
        `Monatliches Budget von €${organization.budget_limit} erreicht. Bitte Admin kontaktieren.`,
        402
      );
    }

    // Workspace-Budget prüfen (falls gesetzt)
    if (workspace.budget_limit) {
      const { data: wsUsage } = await supabase
        .from("usage_logs")
        .select("cost_eur")
        .eq("workspace_id", workspace_id)
        .gte("created_at", startOfMonth.toISOString());

      const wsSpent = wsUsage?.reduce((sum, row) => sum + (row.cost_eur || 0), 0) ?? 0;

      if (wsSpent >= workspace.budget_limit) {
        return errorResponse(
          `Workspace-Budget von €${workspace.budget_limit} erreicht.`,
          402
        );
      }
    }

    // 8. User-Nachricht in DB speichern
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id,
      role: "user",
      content: message,
      model_used: model,
    });

    if (msgError) return errorResponse("Nachricht konnte nicht gespeichert werden", 500);

    // 9. Dify API aufrufen
    const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: "blocking",
        conversation_id: conversation_id,
        user: user.id,
        model: model,
      }),
    });

    if (!difyResponse.ok) {
      const difyError = await difyResponse.text();
      console.error("Dify Fehler:", difyError);
      return errorResponse("AI-Service nicht erreichbar", 502);
    }

    const difyData: DifyResponse = await difyResponse.json();
    const { answer, usage } = difyData;

    // 10. Kosten berechnen
    const costEur = calculateCost(
      usage.prompt_tokens,
      usage.completion_tokens,
      modelData.cost_per_1k_input,
      modelData.cost_per_1k_output
    );

    // 11. Assistant-Antwort in DB speichern
    await supabase.from("messages").insert({
      conversation_id,
      role: "assistant",
      content: answer,
      model_used: model,
      tokens_input: usage.prompt_tokens,
      tokens_output: usage.completion_tokens,
      cost_eur: costEur,
    });

    // 12. Usage Log schreiben (Governance)
    await supabase.from("usage_logs").insert({
      organization_id: userProfile.organization_id,
      workspace_id,
      user_id: user.id,
      model_id: modelData.id,
      tokens_input: usage.prompt_tokens,
      tokens_output: usage.completion_tokens,
      cost_eur: costEur,
    });

    // 13. Antwort zurück an Client
    return successResponse({
      answer,
      usage: {
        tokens_input: usage.prompt_tokens,
        tokens_output: usage.completion_tokens,
        cost_eur: costEur,
      },
      budget: {
        spent_this_month: Math.round((totalSpentThisMonth + costEur) * 100) / 100,
        limit: organization.budget_limit ?? null,
      },
    });

  } catch (err) {
    console.error("Unerwarteter Fehler:", err);
    return errorResponse("Interner Serverfehler", 500);
  }
});
