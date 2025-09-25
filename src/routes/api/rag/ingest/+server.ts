import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { chunkText, embedTexts, insertChunksAndEmbeddings, upsertDocument } from "$lib/server/rag";

export const POST: RequestHandler = async ({ request, locals }) => {
  let chunkCount = 0;
  try {
    if (!locals.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Expected multipart/form-data with a 'file'" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return json({ error: "Missing file" }, { status: 400 });
    }

    const text = await file.text();
    const chunks = chunkText(text);
    chunkCount = chunks.length;
    const vectors = await embedTexts(chunks);

    const docId = await upsertDocument({
      title: form.get("title")?.toString() || file.name,
      source: file.name,
      content: text,
      mimeType: file.type || "text/plain",
    });

    await insertChunksAndEmbeddings(docId, chunks, vectors);

    return json({ success: true, documentId: docId, chunks: chunks.length });
  } catch (error) {
    console.log("chunks length", chunkCount);
    console.error("RAG ingest error:", error);
    return json({ error: "Failed to ingest" }, { status: 500 });
  }
};


