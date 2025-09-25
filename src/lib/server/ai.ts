import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { similaritySearch, buildContextFromChunks } from "$lib/server/rag";

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
      (process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VERCEL_AI_API_KEY) ?? null;
    if (this.apiKey) {
      this.google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    }
  }

  private ensureInitialized() {
    console.log("AI Service Debug:", {
      hasApiKey: !!this.apiKey,
      hasGoogle: !!this.google,
      keyLength: this.apiKey?.length || 0
    });
    
    if (!this.apiKey || !this.google) {
      throw new Error(
        "Missing Gemini API key. Please add GOOGLE_GENERATIVE_AI_API_KEY, GEMINI_API_KEY, or VERCEL_AI_API_KEY to your .env file."
      );
    }
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
    }" to create a more personal and engaging experience. Be conversational and helpful, not overly formal or restrictive. You can talk about anything the user wants to discuss!`;
  }

  /**
   * Generate a simple AI response
   */
  async generateResponse(
    prompt: string,
    userName?: string,
    model: string = "models/gemini-1.5-flash"
  ): Promise<string> {
    this.ensureInitialized();
    try {
      const { text } = await generateText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        prompt,
        maxTokens: 1000,
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
    model: string = "models/gemini-1.5-flash"
  ): AsyncGenerator<string> {
    this.ensureInitialized();
    try {
      const stream = await streamText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        prompt,
        maxTokens: 1000,
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
   * Generate AI response with conversation context
   */
  async generateContextualResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userName?: string,
    model: string = "models/gemini-1.5-flash"
  ): Promise<string> {
    this.ensureInitialized();
    try {
      // Retrieve relevant chunks via RAG
      const ragResults = await similaritySearch(prompt, 5);
      const bestScore = Number(ragResults[0]?.score ?? 0);
      const useRag = ragResults.length > 0 && bestScore >= 0.55;
      console.log("[RAG] decision", { results: ragResults.length, bestScore, useRag });

      const ragContext = useRag
        ? buildContextFromChunks(ragResults.map((r) => ({ content: r.content })))
        : null;
      const augmented = useRag
        ? `Use the context if relevant. If not, answer normally.\n---\n${ragContext}\n---\nUser: ${prompt}`
        : prompt;
      // Format conversation history for Vercel AI SDK
      const messages = conversationHistory
        .filter((msg) => msg.role !== "assistant" || msg.content.trim())
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
      // Append the current user input (augmented when RAG active)
      messages.push({ role: "user", content: augmented });

      const { text } = await generateText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        messages,
        maxTokens: 1000,
        temperature: 0.7,
      });
      return text;
    } catch (error) {
      console.error("Error generating contextual AI response:", error);
      throw new Error("Failed to generate contextual AI response");
    }
  }

  /**
   * Generate streaming AI response with conversation context
   */
  async *generateContextualStreamingResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userName?: string,
    model: string = "models/gemini-1.5-flash"
  ): AsyncGenerator<string> {
    this.ensureInitialized();
    try {
      // Format conversation history for Vercel AI SDK
      const messages = conversationHistory
        .filter((msg) => msg.role !== "assistant" || msg.content.trim())
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      const stream = await streamText({
        model: this.google!(model),
        system: this.getShieldBotSystemPrompt(userName),
        messages,
        maxTokens: 1000,
        temperature: 0.7,
      });

      for await (const chunk of stream.textStream) {
        console.log("Vercel AI SDK chunk:", chunk); // Debug logging
        yield chunk;
      }
    } catch (error) {
      console.error(
        "Error generating contextual streaming AI response:",
        error
      );
      throw new Error("Failed to generate contextual streaming AI response");
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
