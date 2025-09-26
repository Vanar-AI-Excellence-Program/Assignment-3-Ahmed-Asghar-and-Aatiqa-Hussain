import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { env } from "$env/dynamic/private";

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
      env.GEMINI_API_KEY ||
      env.GOOGLE_AI_API_KEY ||
      env.GOOGLE_GENERATIVE_AI_API_KEY ||
      env.VERCEL_AI_API_KEY;
    if (this.apiKey) {
      this.google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    }
  }

  private ensureInitialized() {
    if (!this.apiKey || !this.google) {
      console.error("❌ Missing Google AI API Key!");
      console.error("Available environment variables:", {
        GOOGLE_AI_API_KEY: !!env.GOOGLE_AI_API_KEY,
        GOOGLE_GENERATIVE_AI_API_KEY: !!env.GOOGLE_GENERATIVE_AI_API_KEY,
        GEMINI_API_KEY: !!env.GEMINI_API_KEY,
        VERCEL_AI_API_KEY: !!env.VERCEL_AI_API_KEY,
      });
      throw new Error(
        "Missing Google AI API key. Please add GOOGLE_AI_API_KEY to your .env file. Get your API key from https://aistudio.google.com/"
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
   * Generate AI response with conversation context
   */
  async generateContextualResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userName?: string,
    model: string = "gemini-2.5-pro"
  ): Promise<string> {
    this.ensureInitialized();
    try {
      // Format conversation history for Vercel AI SDK
      const messages = conversationHistory
        .filter((msg) => msg.role !== "assistant" || msg.content.trim())
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

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
   * Generate streaming AI response with conversation context
   */
  async *generateContextualStreamingResponse(
    prompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userName?: string,
    model: string = "gemini-2.5-pro"
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
        maxTokens: 4000,
        temperature: 0.7,
      });

      for await (const chunk of stream.textStream) {
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
