// knowledge-ingest/index.ts
// Nimmt document_id entgegen, liest Datei aus Storage, chunked, embedded, speichert

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unzipSync } from "https://esm.sh/fflate@0.8.2";

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
      // DOCX ist ein ZIP-Archiv — erst entpacken, dann word/document.xml parsen
      try {
        const unzipped = unzipSync(content);
        const docXmlBytes = unzipped["word/document.xml"];
        if (!docXmlBytes) return "";
        const xmlText = new TextDecoder("utf-8").decode(docXmlBytes);
        const xmlMatches = xmlText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
        return xmlMatches
          .map(m => m.replace(/<[^>]+>/g, ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      } catch {
        return "";
      }
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

  // Hilfsfunktion: Schreibt aktuellen Step in error_message (Debugging)
  async function step(msg: string) {
    await supabase.from("knowledge_documents")
      .update({ error_message: `[step] ${msg}` })
      .eq("id", document_id);
  }

  try {
    await step("storage download");
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("knowledge-files")
      .download(doc.storage_path);

    if (fileErr || !fileData) throw new Error(`Storage: ${fileErr?.message ?? "kein fileData"}`);

    await step("text extraction");
    const content = new Uint8Array(await fileData.arrayBuffer());
    let text = await extractText(content, doc.file_type ?? "txt");

    if (!text || text.length < 10) {
      text = `[${doc.title}] – Dokument konnte nicht als Text extrahiert werden (Dateityp: ${doc.file_type ?? "unbekannt"}).`;
    }

    await step("chunking");
    const chunks = chunkText(text);
    const safeChunks = chunks.length > 0 ? chunks : [text.slice(0, CHUNK_SIZE)];

    await step(`embeddings (${safeChunks.length} chunks)`);
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < safeChunks.length; i += BATCH_SIZE) {
      const batch = safeChunks.slice(i, i + BATCH_SIZE);
      const embeddings = await createEmbeddings(batch);
      allEmbeddings.push(...embeddings);
    }

    await step("db insert chunks");
    await supabase.from("knowledge_chunks").delete().eq("document_id", document_id);

    const chunkRows = safeChunks.map((chunkContent, i) => ({
      document_id,
      organization_id: doc.organization_id,
      user_id: doc.user_id,
      project_id: doc.project_id,
      content: chunkContent,
      embedding: `[${allEmbeddings[i].join(",")}]`,
      chunk_index: i,
      metadata: { source: doc.title, file_type: doc.file_type },
    }));

    const { error: insertErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
    if (insertErr) throw new Error(`Chunk-Insert: ${insertErr.message}`);

    await supabase
      .from("knowledge_documents")
      .update({ status: "ready", chunk_count: safeChunks.length, error_message: null })
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
