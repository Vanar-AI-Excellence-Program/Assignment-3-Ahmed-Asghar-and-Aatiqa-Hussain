/**
 * Client-side Chat Service for ShieldBot
 * Handles communication with the AI chat API from the browser
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  citations?: Array<{ documentTitle?: string; documentSource?: string; score: number }>;
  timestamp: string;
}

export interface ChatError {
  error: string;
  details?: string;
}

export class ClientChatService {
  /**
   * Send a message and get a response
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    model: string = "models/gemini-1.5-flash"
  ): Promise<ChatResponse> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model,
        }),
      });

      if (!response.ok) {
        const errorData: ChatError = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Send a message and get a streaming response with letter-by-letter streaming
   */
  async *sendStreamingMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    model: string = "models/gemini-1.5-flash"
  ): AsyncGenerator<{
    type: "chunk" | "complete" | "error";
    content?: string;
    error?: string;
    details?: string;
    citations?: Array<{ documentTitle?: string; documentSource?: string; score: number }>;
  }> {
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model,
        }),
      });

      if (!response.ok) {
        const errorData: ChatError = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          console.log("Received chunk:", chunk); // Debug logging

          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                console.log("Parsed streaming data:", data); // Debug logging

                if (data.type === "chunk" && data.content) {
                  // Accumulate content and stream word by word
                  accumulatedContent += data.content;

                  // Split new content into words and stream each word
                  const newWords = data.content.split(/(\s+)/); // Split on whitespace but keep separators

                  for (const word of newWords) {
                    if (word.trim()) {
                      // Only stream non-empty words
                      yield {
                        type: "chunk",
                        content: word,
                      };

                      // Add delay between words (adjust speed here)
                      await new Promise((resolve) => setTimeout(resolve, 100));
                    } else if (word) {
                      // Stream whitespace immediately
                      yield {
                        type: "chunk",
                        content: word,
                      };
                    }
                  }
                } else if (data.type === "complete") {
                  // Send completion signal with citations
                  yield {
                    type: "complete",
                    citations: data.citations
                  };
                } else if (data.type === "error") {
                  yield data;
                }
              } catch (parseError) {
                console.error(
                  "Error parsing streaming data:",
                  parseError,
                  "Line:",
                  line
                );
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Error sending streaming message:", error);
      yield {
        type: "error",
        error: "Failed to send message",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a new chat message
   */
  createMessage(role: "user" | "assistant", content: string): ChatMessage {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
    };
  }

  /**
   * Format conversation history for display
   */
  formatConversationHistory(messages: ChatMessage[]): string {
    return messages
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");
  }
}

// Export singleton instance
export const clientChatService = new ClientChatService();
