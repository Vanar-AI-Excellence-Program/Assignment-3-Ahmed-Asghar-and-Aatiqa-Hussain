import { db } from "$lib/server/db";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
// Use process.env to avoid relying on SvelteKit's $env in shared server utils

const DEFAULT_EMBEDDING_MODEL = "text-embedding-004"; // Google Gemini
// Target dimension for pgvector column (MiniLM = 384). Must match DB column.
const TARGET_VECTOR_DIMENSION = 384;

export function chunkText(
  text: string,
  chunkSize: number = 800,
  chunkOverlap: number = 200
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end);
    chunks.push(chunk);
    if (end === normalized.length) break;
    start = Math.max(0, end - chunkOverlap);
  }
  return chunks;
}

function getGoogleClient() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.VERCEL_AI_API_KEY;
  if (!apiKey) throw new Error("Missing Google Generative AI API key");
  return createGoogleGenerativeAI({ apiKey });
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  // Prefer external embedding service if configured
  const serviceUrlEnv = process.env.EMBEDDING_API_URL;
  if (serviceUrlEnv) {
    try {
      const url = `${serviceUrlEnv.replace(/\/$/, "")}/embed`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });
      if (!response.ok) {
        console.warn("Embedding service responded with", response.status);
      } else {
        const data = (await response.json()) as { vectors?: number[][]; embeddings?: number[][] };
        const vecs = data?.vectors ?? data?.embeddings;
        if (Array.isArray(vecs)) {
          return vecs;
        }
      }
    } catch (err) {
      console.warn("Embedding service fetch failed; falling back to Gemini:", err);
    }
  }

  // Fallback to Gemini embeddings via direct API call
  const google = getGoogleClient();
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_EMBEDDING_MODEL}:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map(text => ({
        content: { parts: [{ text }] }
      }))
    })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.embeddings.map((emb: any) => emb.values);
}

export async function upsertDocument(params: {
  id?: string;
  title?: string | null;
  source?: string | null;
  content?: string | null;
  mimeType?: string | null;
}): Promise<string> {
  const id = params.id ?? nanoid();
  await db.execute(sql`
    INSERT INTO documents (id, title, source, content, mime_type)
    VALUES (${id}, ${params.title ?? null}, ${params.source ?? null}, ${params.content ?? null}, ${params.mimeType ?? null})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      source = EXCLUDED.source,
      content = EXCLUDED.content,
      mime_type = EXCLUDED.mime_type,
      updated_at = NOW();
  `);
  return id;
}

function normalizeVectorDimension(vector: number[], targetDim: number): number[] {
  if (!Array.isArray(vector)) return [];
  if (vector.length === targetDim) return vector;
  if (vector.length > targetDim) return vector.slice(0, targetDim);
  // pad with zeros if smaller
  return vector.concat(Array(targetDim - vector.length).fill(0));
}

export async function insertChunksAndEmbeddings(
  documentId: string,
  chunks: string[],
  embeddings: number[][]
): Promise<{ chunkIds: string[] }>
{
  if (chunks.length !== embeddings.length) {
  
    throw new Error("Chunks and embeddings length mismatch");
  }
  const chunkIds: string[] = [];
  await db.transaction(async (tx) => {
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = nanoid();
      chunkIds.push(chunkId);
      await tx.execute(sql`
        INSERT INTO document_chunks (id, document_id, chunk_index, content)
        VALUES (${chunkId}, ${documentId}, ${i}, ${chunks[i]});
      `);
      const vec = normalizeVectorDimension(embeddings[i], TARGET_VECTOR_DIMENSION);
      // pgvector literal: '[v1,v2,...]'
      const vectorLiteral = `[${vec.join(",")}]`;
      await tx.execute(sql`
        INSERT INTO chunk_embeddings (id, chunk_id, embedding)
        VALUES (${nanoid()}, ${chunkId}, ${sql.raw(`'${vectorLiteral}'`)});
      `);
    }
  });
  return { chunkIds };
}

export async function similaritySearch(
  query: string,
  topK: number = 5
): Promise<Array<{ chunkId: string; content: string; score: number; documentId: string; documentTitle?: string; documentSource?: string }>> {
  try {
    console.log("[RAG] similaritySearch entered", { querySnippet: query.slice(0, 60), topK });
    const [rawQueryEmbedding] = await embedTexts([query]);
    const queryEmbedding = normalizeVectorDimension(rawQueryEmbedding, TARGET_VECTOR_DIMENSION);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    const result = await db.execute(sql`
      SELECT 
        dc.id as chunk_id, 
        dc.content, 
        dc.document_id, 
        d.title as document_title,
        d.source as document_source,
        1 - (ce.embedding <#> ${sql.raw(`'${vectorLiteral}'::vector`)}) AS score
      FROM chunk_embeddings ce
      JOIN document_chunks dc ON dc.id = ce.chunk_id
      JOIN documents d ON d.id = dc.document_id
      ORDER BY ce.embedding <#> ${sql.raw(`'${vectorLiteral}'::vector`)} ASC
      LIMIT ${topK};
    `);
    const rows = (result as any).rows || [];
    const top = rows[0]?.score;
    console.log("[RAG] similaritySearch results", { count: rows.length, topScore: Number(top) || 0 });
    return rows.map((r: any) => ({
      chunkId: r.chunk_id,
      content: r.content,
      score: Number(r.score),
      documentId: r.document_id,
      documentTitle: r.document_title,
      documentSource: r.document_source,
    }));
  } catch (error) {
    console.warn("Similarity search failed:", error);
    return []; // Return empty array if search fails
  }
}

export function buildContextFromChunks(
  chunks: Array<{ content: string }>,
  maxChars: number = 2500
): string {
  const parts: string[] = [];
  let total = 0;
  for (const c of chunks) {
    if (total + c.content.length > maxChars) break;
    parts.push(c.content);
    total += c.content.length;
  }
  return parts.join("\n---\n");
}


