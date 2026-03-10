// knowledge-ingest/index.ts
// Nimmt document_id entgegen, liest Datei aus Storage, chunked, embedded, speichert

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY       = Deno.env.get("OPENAI_API_KEY")!;

const CHUNK_SIZE      = 800;
const CHUNK_OVERLAP   = 100;
const EMBEDDING_MODEL = "text-embedding-3-small";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
    if (start >= cleaned.length) break;
  }
  return chunks.filter(c => c.trim().length > 50);
}

async function extractText(content: Uint8Array, fileType: string): Promise<string> {
  switch (fileType.toLowerCase()) {
    case "txt":
    case "md":
    case "csv":
      return new TextDecoder("utf-8").decode(content);

    case "pdf": {
      const text = new TextDecoder("latin1").decode(content);
      const matches = text.match(/BT[\s\S]*?ET/g) ?? [];
      const extracted = matches
        .join("\n")
        .replace(/\(([^)]+)\)\s*Tj/g, "$1 ")
        .replace(/\[([^\]]+)\]\s*TJ/g, (_, m) =>
          m.replace(/\(([^)]*)\)/g, "$1 ").replace(/-?\d+(\.\d+)?\s*/g, "")
        )
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return extracted || "PDF-Textextraktion nicht verfügbar für dieses Dokument.";
    }

    case "docx": {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(content);
      const xmlMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) ?? [];
      return xmlMatches
        .map(m => m.replace(/<[^>]+>/g, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    default:
      return new TextDecoder("utf-8", { fatal: false }).decode(content);
  }
}

async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) throw new Error(`OpenAI Embeddings Fehler: ${await res.text()}`);
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let document_id: string;
  try {
    const body = await req.json();
    document_id = body.document_id;
    if (!document_id) throw new Error("document_id fehlt");
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  const { data: doc, error: docErr } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", document_id)
    .single();

  if (docErr || !doc) {
    return new Response(JSON.stringify({ error: "Dokument nicht gefunden" }), {
      status: 404,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    await supabase
      .from("knowledge_documents")
      .update({ status: "processing" })
      .eq("id", document_id);

    const { data: fileData, error: fileErr } = await supabase.storage
      .from("knowledge-files")
      .download(doc.storage_path);

    if (fileErr || !fileData) throw new Error(`Storage-Fehler: ${fileErr?.message}`);

    const content = new Uint8Array(await fileData.arrayBuffer());
    const text = await extractText(content, doc.file_type ?? "txt");

    if (!text || text.length < 10) throw new Error("Kein Text extrahierbar");

    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("Keine Chunks erstellt");

    // Embeddings in Batches (max 100 pro Request)
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await createEmbeddings(batch);
      allEmbeddings.push(...embeddings);
    }

    // Alte Chunks löschen (bei Re-Ingest)
    await supabase.from("knowledge_chunks").delete().eq("document_id", document_id);

    const chunkRows = chunks.map((content, i) => ({
      document_id,
      organization_id: doc.organization_id,
      user_id: doc.user_id,
      project_id: doc.project_id,
      content,
      embedding: `[${allEmbeddings[i].join(",")}]`,
      chunk_index: i,
      metadata: { source: doc.title, file_type: doc.file_type },
    }));

    const { error: insertErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
    if (insertErr) throw new Error(`Insert-Fehler: ${insertErr.message}`);

    await supabase
      .from("knowledge_documents")
      .update({ status: "ready", chunk_count: chunks.length, error_message: null })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  } catch (err) {
    await supabase
      .from("knowledge_documents")
      .update({ status: "error", error_message: String(err) })
      .eq("id", document_id);

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
});
