import type { RequestHandler } from "./$types";
import { aiService } from "$lib/server/ai";
import { databaseChatService } from "$lib/services/databaseChatService";
import { eq } from "drizzle-orm";
import { ragDocuments } from "$lib/server/db/schema";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    const auth = locals.auth as any;
    if (!auth?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      message,
      conversationHistory = [],
      model = "gemini-2.5-pro",
      conversationId,
    } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation history format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract user name for personalization
    let userName = "User";

    if (auth.user.name && auth.user.name !== "The Shield") {
      userName = auth.user.name;
    } else if (auth.user.email) {
      // Try to extract a better name from email
      const emailPrefix = auth.user.email.split("@")[0];
      // For now, let's use a more friendly approach - try to make it look like a name
      if (emailPrefix === "shieldauthsec") {
        userName = "Shield"; // Use "Shield" as a friendly name
      } else if (
        emailPrefix.includes(".") ||
        /\d/.test(emailPrefix) ||
        emailPrefix.length > 10
      ) {
        // Try to extract a reasonable name from complex usernames
        const cleanName = emailPrefix
          .replace(/[._-]/g, " ")
          .replace(/\d/g, "");
        if (cleanName.length > 2) {
          userName =
            cleanName.split(" ")[0].charAt(0).toUpperCase() +
            cleanName.split(" ")[0].slice(1);
        } else {
          userName = "User";
        }
      } else {
        // Capitalize first letter if it looks like a name
        userName =
          emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
    }

    console.log("User data for AI:", {
      name: auth.user.name,
      email: auth.user.email,
      extractedName: userName,
    });

    // Create a readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let contextSnippets: any[] = [];
        let citations: any[] = [];

        try {
          console.log("Streaming API - Message received:", message.substring(0, 200) + "...");

          // Check if message contains file content and ingest it
          const fileMatch = message.match(/\[File Content: ([^\]]+)\]\n([\s\S]*)/);
          if (fileMatch) {
            const filename = fileMatch[1];
            const fileContent = fileMatch[2];
            const cleanMessage = message.replace(fileMatch[0], '').trim();

            try {
              console.log(`Ingesting document: ${filename}`);
              // Import the RAG ingestion logic
              const { db, EMBEDDING_API_URL } = await import("$lib/server/db");
              const { ragDocuments, ragDocumentChunks, ragDocumentEmbeddings } = await import("$lib/server/db/schema");
              const { nanoid } = await import("nanoid");

              // Chunk the file content
              function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
                const chunks: string[] = [];
                let i = 0;
                while (i < text.length) {
                  const end = Math.min(i + chunkSize, text.length);
                  chunks.push(text.slice(i, end));
                  i = Math.max(0, end - overlap);
                }
                return chunks;
              }

              const docId = nanoid();
              const pieces = chunkText(fileContent);
              const chunkIds: string[] = [];

              // Save document
              await db.insert(ragDocuments).values({
                id: docId,
                userId: auth.user.id,
                conversationId: conversationId || null,
                filename,
                originalName: filename,
                mimeType: "text/plain",
                fileSize: fileContent.length,
                content: fileContent,
                status: "processing",
              });

              // Chunk and store
              let idx = 0;
              for (const piece of pieces) {
                const chunkId = nanoid();
                chunkIds.push(chunkId);
                await db.insert(ragDocumentChunks).values({
                  id: chunkId,
                  documentId: docId,
                  chunkIndex: idx++,
                  content: piece,
                });
              }

              // Embed each chunk
              for (let i = 0; i < pieces.length; i++) {
                try {
                  const embeddingRes = await fetch(`${EMBEDDING_API_URL}/embed`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: pieces[i] }),
                  });

                  if (embeddingRes.ok) {
                    const { embedding } = await embeddingRes.json();
                    await db.insert(ragDocumentEmbeddings).values({
                      id: nanoid(),
                      chunkId: chunkIds[i],
                      embedding,
                      dimension: embedding.length,
                    });
                  }
                } catch (embedError) {
                  console.error(`Failed to embed chunk ${i}:`, embedError);
                }
              }

              // Update document status
              const { ragDocuments: ragDocsTable } = await import("$lib/server/db/schema");
              await db.update(ragDocsTable)
                .set({ status: "completed" })
                .where(eq(ragDocsTable.id, docId));

              console.log(`Successfully ingested document: ${filename} with ${pieces.length} chunks`);
            } catch (ingestError) {
              console.error("Failed to ingest document:", ingestError);
            }
          }

          // Retrieve semantic context via RAG (with timeout)
          let enhancedMessage = message;
          try {
            // Add timeout to prevent hanging
            const contextPromise = databaseChatService.retrieveContext({
              query: message,
              conversationId,
              topK: 3,
            });

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("RAG retrieval timeout")), 5000)
            );

            const contextResult = await Promise.race([contextPromise, timeoutPromise]) as any;
            contextSnippets = contextResult.contexts || [];

            if (contextSnippets.length > 0) {
              const contextText = contextSnippets
                .map((ctx: any, index: number) => `[Context ${index + 1}]: ${ctx.content}`)
                .join("\n\n");
              enhancedMessage = `${message}\n\nRelevant context:\n${contextText}`;

              citations = contextSnippets.map((ctx: any, index: number) => ({
                id: ctx.id,
                content: String(ctx.content).slice(0, 200) + (String(ctx.content).length > 200 ? "..." : ""),
                score: ctx.score,
                index: index + 1,
              }));
            }
          } catch (e) {
            console.warn("RAG retrieval failed or timed out; proceeding without context", e);
          }

          const responseStream = aiService.generateContextualStreamingResponse(
            enhancedMessage,
            conversationHistory,
            userName,
            model
          );

          // Stream chunks with proper error handling
          let chunkCount = 0;
          try {
            for await (const chunk of responseStream) {
              if (chunkCount > 1000) { // Prevent infinite streaming
                console.warn("Streaming limit reached, stopping");
                break;
              }

              const data =
                JSON.stringify({ type: "chunk", content: chunk, timestamp: new Date().toISOString() }) + "\n";
              controller.enqueue(new TextEncoder().encode(data));
              chunkCount++;
            }
          } catch (streamError) {
            console.error("Error in streaming:", streamError);
            throw streamError;
          }

          // Send completion signal with citations
          const completionData =
            JSON.stringify({
              type: "complete",
              citations: citations,
              timestamp: new Date().toISOString(),
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(completionData));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData =
            JSON.stringify({
              type: "error",
              error: "Failed to generate response",
              details: error instanceof Error ? error.message : "Unknown error",
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("Chat stream API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
