import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { ragDocumentChunks } from "$lib/server/db/schema";
import { and, eq, desc } from "drizzle-orm";

// Temporary: naive retrieval using keyword overlap; we'll switch to pgvector similarity later
function scoreChunk(query: string, content: string): number {
  const q = query.toLowerCase();
  const c = content.toLowerCase();
  let score = 0;
  for (const token of q.split(/\W+/).filter(Boolean)) {
    if (c.includes(token)) score += 1;
  }
  return score;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const auth = locals.auth as any;
    if (!auth?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { query, conversationId, topK = 5 } = body || {};
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user's chunks (optionally scoped to conversation)
    let chunks = await db
      .select()
      .from(ragDocumentChunks)
      .orderBy(desc(ragDocumentChunks.createdAt));

    // Naive score + take topK
    const scored = chunks
      .map((c) => ({ ...c, _score: scoreChunk(query, c.content) }))
      .filter((c) => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, Math.min(topK, 10));

    return new Response(
      JSON.stringify({
        contexts: scored.map((c) => ({
          id: c.id,
          content: c.content,
          score: c._score,
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("RAG retrieve error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
