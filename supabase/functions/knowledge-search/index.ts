// knowledge-search/index.ts
// Nimmt Query + Kontext, gibt Top-5 Chunks zurück (Priorität: Projekt → User → Org)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY       = Deno.env.get("OPENAI_API_KEY")!;
const EMBEDDING_MODEL      = "text-embedding-3-small";
const TOP_K                = 5;
const SIMILARITY_THRESHOLD = 0.3;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

async function createEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!res.ok) throw new Error(`OpenAI Embedding Fehler: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  let query: string, org_id: string, user_id: string, project_id: string | null;

  try {
    const body = await req.json();
    query      = String(body.query ?? "").trim();
    org_id     = body.org_id;
    user_id    = body.user_id;
    project_id = body.project_id ?? null;

    if (!query || !org_id || !user_id) throw new Error("query, org_id und user_id sind Pflicht");
  } catch (e) {
    console.error('[knowledge-search] parse error:', e)
    return new Response(JSON.stringify({ error: "Ungültige Anfrage" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const queryEmbedding = await createEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const { data: results, error } = await supabase.rpc("search_knowledge_chunks", {
      query_embedding:  embeddingStr,
      match_org_id:     org_id,
      match_user_id:    user_id,
      match_project_id: project_id,
      match_threshold:  SIMILARITY_THRESHOLD,
      match_count:      TOP_K * 3,
    });

    if (error) throw new Error(error.message);

    const scored = (results ?? []).map((r: {
      id: string; content: string; similarity: number;
      document_id: string; user_id: string | null; project_id: string | null;
      metadata: Record<string, string>;
    }) => ({
      ...r,
      priority: r.project_id ? 3 : r.user_id ? 2 : 1,
      score: r.similarity + (r.project_id ? 0.2 : r.user_id ? 0.1 : 0),
    }));

    scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    const topChunks = scored.slice(0, TOP_K);

    const documentIds = [...new Set(topChunks.map((c: { document_id: string }) => c.document_id))];
    const { data: docs } = await supabase
      .from("knowledge_documents")
      .select("id, title, created_at, file_type")
      .in("id", documentIds);

    const docMap = new Map((docs ?? []).map((d: {
      id: string; title: string; created_at: string; file_type: string;
    }) => [d.id, d]));

    const chunks = topChunks.map((c: {
      id: string; content: string; similarity: number;
      document_id: string; priority: number; score: number;
    }) => {
      const doc = docMap.get(c.document_id) as {
        title: string; created_at: string; file_type: string;
      } | undefined;
      return {
        chunk_id:   c.id,
        content:    c.content,
        similarity: c.similarity,
        priority:   c.priority,
        citation:   doc
          ? `Quelle: ${doc.title} · ${new Date(doc.created_at).toLocaleDateString("de-DE")}`
          : "Quelle: Wissensbasis",
        document: doc ?? null,
      };
    });

    return new Response(JSON.stringify({ chunks, total: chunks.length }), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('[knowledge-search] search error:', err)
    return new Response(JSON.stringify({ error: "Suche fehlgeschlagen" }), {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
});
