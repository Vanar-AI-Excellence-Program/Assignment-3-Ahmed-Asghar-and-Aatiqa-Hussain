import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { ragDocuments, ragDocumentChunks } from "$lib/server/db/schema";
import { nanoid } from "nanoid";

// Simple text chunker
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
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
    const { filename, mimeType, content, conversationId } = body || {};

    if (!filename || !mimeType || !content) {
      return new Response(
        JSON.stringify({ error: "filename, mimeType, content required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const docId = nanoid();
    await db.insert(ragDocuments).values({
      id: docId,
      userId: auth.user.id,
      conversationId: conversationId || null,
      filename,
      originalName: filename,
      mimeType,
      fileSize: content.length,
      content,
      status: "completed",
    });

    const pieces = chunkText(content);
    let idx = 0;
    for (const piece of pieces) {
      await db.insert(ragDocumentChunks).values({
        id: nanoid(),
        documentId: docId,
        chunkIndex: idx++,
        content: piece,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, documentId: docId, chunks: pieces.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("RAG ingest error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
