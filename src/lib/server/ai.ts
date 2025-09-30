import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { EMBEDDING_API_URL } from "$lib/server/db";
import { documentStorageService } from "$lib/services/documentStorageService";

/**
 * AI Service for ShieldBot
 * Handles Gemini API integration using Vercel AI SDK
 */

export class AIService {
  private google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Try multiple possible environment variable names
    this.apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.VERCEL_AI_API_KEY ||
      null;
    if (this.apiKey) {
      this.google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    }
  }

  private ensureInitialized() {
    if (!this.apiKey || !this.google) {
      console.error("❌ Missing Google AI API Key!");
      console.error("Available environment variables:", {
        GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
        GOOGLE_GENERATIVE_AI_API_KEY:
          !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        VERCEL_AI_API_KEY: !!process.env.VERCEL_AI_API_KEY,
      });
      throw new Error(
        "Missing Google AI API key. Please add GOOGLE_AI_API_KEY to your .env file. Get your API key from https://aistudio.google.com/"
      );
    }
  }

  // Call the Python microservice to embed text
  async embedText(text: string): Promise<number[]> {
    const res = await fetch(`${EMBEDDING_API_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Embedding failed (${res.status}): ${body}`);
    }
    const data = await res.json();
    return data.embedding as number[];
  }

  /**
   * Get ShieldBot system prompt for personality
   */
  private getShieldBotSystemPrompt(userName?: string): string {
    const greeting = userName ? `Hello ${userName}! ` : "";
    return `${greeting}You are ShieldBot, a friendly and helpful AI assistant. You are part of the ShieldAuth platform, designed to help users with various topics while having expertise in cybersecurity and digital security.

Your personality and characteristics:
- You are knowledgeable, helpful, and professional
- You are friendly and approachable, like a helpful friend
- You can discuss ANY topic the user wants to talk about
- While you have expertise in cybersecurity, authentication, and digital security, you're not limited to these topics
- You provide clear, helpful advice and explanations on any subject
- You always prioritize being helpful and engaging
- You always address the user by their name when you know it: ${
      userName || "[User Name]"
    }

Your capabilities:
- Answer questions about ANY topic (technology, general knowledge, advice, etc.)
- Provide guidance on cybersecurity and digital security (your specialty)
- Help with general questions and have friendly conversations
- Offer practical advice and recommendations on various subjects
- Be a helpful, knowledgeable companion for any topic

Always respond as ShieldBot, maintaining your friendly and helpful personality. When addressing the user, use their name "${
      userName || "[User Name]"
    }" to create a more personal and engaging experience. Be conversational and helpful, not overly formal or restrictive. Avoid filler closings like "I hope this helps" or "let me know if you need more"; instead, end with the most relevant information or a concise next step. You can talk about anything the user wants to discuss!`;
  }

  /**
   * Generate a simple AI response
   */
  async generateResponse(
    prompt: string,
    userName?: string,
    model: string = "gemini-2.5-pro"
  ): Promise<string> {
    this.ensureInitialized();
    try {
      const { text } = await generateText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
      });
      return text;
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  /**
   * Generate a streaming AI response
   */
  async *generateStreamingResponse(
    prompt: string,
    userName?: string,
    model: string = "gemini-2.5-pro"
  ): AsyncGenerator<string> {
    this.ensureInitialized();
    try {
      const stream = await streamText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
      });

      for await (const chunk of stream.textStream) {
        yield chunk;
      }
    } catch (error) {
      console.error("Error generating streaming AI response:", error);
      throw new Error("Failed to generate streaming AI response");
    }
  }

  /**
   * Generate AI response with conversation context and RAG
   */
  async generateContextualResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userName?: string,
    userId?: string,
    model: string = "gemini-2.5-pro"
  ): Promise<string> {
    this.ensureInitialized();
    try {
      // Get relevant documents using RAG if userId is provided
      let ragContext = "";
      if (userId) {
        try {
          const relevantDocs =
            await documentStorageService.getRelevantDocuments(
              prompt,
              userId,
              3
            );
          // Only include RAG context when similarity is strong enough
          const MIN_SCORE = 0.62; // cosine-like similarity threshold
          const filtered = Array.isArray(relevantDocs)
            ? relevantDocs.filter((d: any) =>
                typeof d?.score === "number" ? d.score >= MIN_SCORE : true
              )
            : [];

          if (filtered.length > 0) {
            ragContext = "\n\nRelevant information from your documents:\n";
            filtered.forEach((doc: any, index: number) => {
              ragContext += `\n${index + 1}. From ${
                doc.document?.originalName ||
                doc.document?.filename ||
                "document"
              }:\n${doc.chunk?.content || doc.content}\n`;
            });
          }
        } catch (ragError) {
          console.error("RAG retrieval error:", ragError);
          // Continue without RAG context
        }
      }

      // Format conversation history for Vercel AI SDK
      const messages = conversationHistory
        .filter((msg) => msg.role !== "assistant" || msg.content.trim())
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Add RAG context to the latest user message if available
      if (ragContext && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
          lastMessage.content += `${ragContext}\n\nIf the question cannot be answered from the provided document snippets, answer from your general knowledge instead.`;
        }
      }

      const { text } = await generateText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        messages,
        maxTokens: 4000,
        temperature: 0.7,
      });
      return text;
    } catch (error) {
      console.error("Error generating contextual AI response:", error);
      throw new Error("Failed to generate contextual AI response");
    }
  }

  /**
   * Generate streaming AI response with conversation context and RAG
   */
  async *generateContextualStreamingResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userName?: string,
    userId?: string,
    model: string = "gemini-2.5-pro"
  ): AsyncGenerator<string> {
    this.ensureInitialized();
    try {
      // Get relevant documents using RAG if userId is provided
      let ragContext = "";
      if (userId) {
        try {
          const relevantDocs =
            await documentStorageService.getRelevantDocuments(
              prompt,
              userId,
              3
            );
          const MIN_SCORE = 0.62;
          const filtered = Array.isArray(relevantDocs)
            ? relevantDocs.filter((d: any) =>
                typeof d?.score === "number" ? d.score >= MIN_SCORE : true
              )
            : [];

          if (filtered.length > 0) {
            ragContext = "\n\nRelevant information from your documents:\n";
            filtered.forEach((doc: any, index: number) => {
              ragContext += `\n${index + 1}. From ${
                doc.document?.originalName ||
                doc.document?.filename ||
                "document"
              }:\n${doc.chunk?.content || doc.content}\n`;
            });
          }
        } catch (ragError) {
          console.error("RAG retrieval error:", ragError);
          // Continue without RAG context
        }
      }

      // Limit conversation history to prevent memory issues
      const limitedHistory = conversationHistory.slice(-10); // Keep only last 10 messages

      // Format conversation history for Vercel AI SDK
      const messages = limitedHistory
        .filter((msg) => msg.role !== "assistant" || msg.content.trim())
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Add the current message with RAG context
      messages.push({
        role: "user",
        content:
          prompt +
          (ragContext
            ? `${ragContext}\n\nIf these snippets are not relevant to the user's question, ignore them and answer from your general knowledge.`
            : ""),
      });

      console.log("AI Service - Processing", messages.length, "messages");

      // If retrieval contexts provided upstream, they should already be
      // appended to the latest user message content. We keep the API the same.
      const stream = await streamText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        messages,
        maxTokens: 2000, // Reduce token limit to prevent memory issues
        temperature: 0.7,
      });

      let chunkCount = 0;
      for await (const chunk of stream.textStream) {
        if (chunkCount > 500) {
          // Prevent infinite streaming
          console.warn("AI streaming limit reached");
          break;
        }
        yield chunk;
        chunkCount++;
      }
    } catch (error) {
      console.error(
        "Error generating contextual streaming AI response:",
        error
      );
      throw new Error("Failed to generate contextual streaming AI response");
    }
  }

  /**
   * Helper method to chunk large text content for memory efficiency
   */
  private chunkText(text: string, maxChunkSize: number = 3000): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChunkSize;

      // Try to break at a sentence or paragraph boundary
      if (end < text.length) {
        const lastSentence = text.lastIndexOf(".", end);
        const lastParagraph = text.lastIndexOf("\n\n", end);
        const lastSpace = text.lastIndexOf(" ", end);

        if (lastParagraph > start + maxChunkSize * 0.5) {
          end = lastParagraph + 2;
        } else if (lastSentence > start + maxChunkSize * 0.5) {
          end = lastSentence + 1;
        } else if (lastSpace > start + maxChunkSize * 0.5) {
          end = lastSpace;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end;
    }

    return chunks;
  }

  /**
   * Helper method to read file content with Node.js compatibility
   */
  private async readFileContent(file: File): Promise<string> {
    try {
      // Convert File to Buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString("utf-8");
    } catch (error) {
      throw new Error("Failed to read file content");
    }
  }

  /**
   * Process file with question using Gemini with memory-efficient chunking and database storage
   */
  async processFileWithQuestion(
    file: File,
    question: string,
    conversationHistory: any[] = [],
    userName: string = "User",
    userId: string = "unknown",
    conversationId?: string,
    model: string = "gemini-2.5-pro"
  ): Promise<string> {
    this.ensureInitialized();

    try {
      // Read file content
      const fileContent = await this.readFileContent(file);

      // Save document to database
      const documentId = await documentStorageService.saveDocument({
        userId,
        conversationId,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        content: fileContent,
      });

      console.log(`Document saved with ID: ${documentId}`);

      // Create context from conversation history
      const historyContext = conversationHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Chunk the file content to prevent memory issues
      const chunks = this.chunkText(fileContent, 3000); // Smaller chunks for server processing
      console.log(`Processing file with ${chunks.length} chunks`);

      // Save chunks to database
      const chunkData = chunks.map((chunk, index) => ({
        content: chunk,
        metadata: {
          chunkIndex: index,
          totalChunks: chunks.length,
          documentId: documentId,
        },
      }));

      const chunkIds = await documentStorageService.saveDocumentChunks(
        documentId,
        chunkData
      );
      console.log(`Saved ${chunkIds.length} chunks to database`);

      // Generate and save embeddings in background
      documentStorageService
        .generateAndSaveEmbeddings(chunkIds, chunkData)
        .then(() => {
          console.log(`Generated embeddings for document ${documentId}`);
          documentStorageService.updateDocumentStatus(documentId, "completed");
        })
        .catch((error) => {
          console.error(
            `Error generating embeddings for document ${documentId}:`,
            error
          );
          documentStorageService.updateDocumentStatus(documentId, "failed");
        });

      let finalAnswer = "";

      if (chunks.length === 1) {
        // Single chunk - process normally
        const systemPrompt = `You are ShieldBot, an AI assistant. The user has uploaded a file and asked a question about it. 
Please analyze the file content and answer their question based on the information in the file.

User: ${userName}
File: ${file.name}
Question: ${question}

File Content:
${fileContent}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ""}

Please provide a comprehensive answer based on the file content. If the question cannot be answered from the file, let the user know what information is available in the file.`;

        const result = await generateText({
          model: this.google!(model),
          prompt: systemPrompt,
          maxTokens: 4000,
        });

        finalAnswer = result.text;
      } else {
        // Multiple chunks - process each chunk and combine results
        const chunkAnswers: string[] = [];

        for (let i = 0; i < Math.min(chunks.length, 3); i++) {
          // Limit to first 3 chunks to prevent timeout
          const chunk = chunks[i];
          const systemPrompt = `You are ShieldBot, an AI assistant. The user has uploaded a file and asked a question about it. 
This is chunk ${i + 1} of ${
            chunks.length
          } from the file. Please analyze this content and provide relevant information for the question.

User: ${userName}
File: ${file.name} (Chunk ${i + 1}/${chunks.length})
Question: ${question}

File Content (Chunk ${i + 1}):
${chunk}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ""}

Please provide relevant information from this chunk that helps answer the question. Be concise and focus on the most relevant parts.`;

          try {
            const result = await generateText({
              model: this.google!(model),
              prompt: systemPrompt,
              maxTokens: 2000, // Smaller tokens per chunk
            });

            chunkAnswers.push(result.text);
          } catch (chunkError) {
            console.error(`Error processing chunk ${i + 1}:`, chunkError);
            continue; // Continue with other chunks
          }
        }

        // Combine chunk answers
        if (chunkAnswers.length > 0) {
          const combinePrompt = `You are ShieldBot. The user asked: "${question}" about the file "${
            file.name
          }".

Here are the answers from different parts of the file:

${chunkAnswers
  .map((answer, index) => `Part ${index + 1}:\n${answer}`)
  .join("\n\n")}

Please provide a comprehensive final answer that combines the relevant information from all parts of the file.`;

          const finalResult = await generateText({
            model: this.google!(model),
            prompt: combinePrompt,
            maxTokens: 3000,
          });

          finalAnswer = finalResult.text;
        } else {
          finalAnswer =
            "I apologize, but I encountered an error processing the file. Please try again or upload a smaller file.";
        }
      }

      return finalAnswer;
    } catch (error) {
      console.error("Error processing file with question:", error);
      throw new Error("Failed to process file with question");
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
