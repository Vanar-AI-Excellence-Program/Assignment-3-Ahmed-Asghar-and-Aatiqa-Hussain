/**
 * Database Chat Service for ShieldBot
 * Handles chat conversations and messages persistence
 */

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  isAutoRenamed: boolean;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  parentId?: string;
  versionGroupId?: string;
  versionNumber?: number;
  isEdited?: boolean;
  isActive?: boolean;
  attachedFile?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface CreateConversationRequest {
  title: string;
}

export interface SaveMessageRequest {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  attachedFile?: {
    name: string;
    size: number;
    type: string;
  };
}

export class DatabaseChatService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await fetch("/api/chat/conversations");

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    request: CreateConversationRequest
  ): Promise<ChatConversation> {
    try {
      const response = await fetch("/api/chat/conversations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      const data = await response.json();
      return data.conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Rename a conversation (optionally mark as auto-renamed once)
   */
  async renameConversation(
    conversationId: string,
    title: string,
    markAutoRenamed: boolean = false
  ): Promise<ChatConversation> {
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/rename`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, markAutoRenamed }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to rename conversation: ${response.status}`);
      }
      const data = await response.json();
      return data.conversation;
    } catch (error) {
      console.error("Error renaming conversation:", error);
      throw error;
    }
  }

  /**
   * Save a message to a conversation
   */
  async saveMessage(request: SaveMessageRequest): Promise<ChatMessage> {
    try {
      const response = await fetch("/api/chat/messages/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to save message: ${response.status}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Regenerate AI response for a message
   */
  async regenerateMessage(messageId: string): Promise<{
    regeneratedAssistantReply: ChatMessage;
    deactivatedMessages: string[];
  }> {
    try {
      const response = await fetch(
        `/api/chat/messages/${messageId}/regenerate`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to regenerate message: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error regenerating message:", error);
      throw error;
    }
  }

  /**
   * Get all versions of a message
   */
  async getMessageVersions(messageId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/versions`);

      if (!response.ok) {
        throw new Error(`Failed to fetch message versions: ${response.status}`);
      }

      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      console.error("Error fetching message versions:", error);
      throw error;
    }
  }

  /**
   * Switch to a specific message version
   */
  async switchMessageVersion(
    messageId: string,
    targetMessageId?: string,
    direction?: "next" | "prev"
  ): Promise<ChatMessage> {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetMessageId, direction }),
      });

      if (!response.ok) {
        throw new Error(`Failed to switch message version: ${response.status}`);
      }

      const data = await response.json();
      return data.switchedTo;
    } catch (error) {
      console.error("Error switching message version:", error);
      throw error;
    }
  }

  /**
   * Edit a user message and regenerate AI response
   */
  async editMessage(
    messageId: string,
    content: string
  ): Promise<{
    editedUserMessage: ChatMessage;
    newAssistantMessage: ChatMessage;
  }> {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  }

  /**
   * Generate a conversation title from the first user message
   */
  generateConversationTitle(firstMessage: string): string {
    // Take first 50 characters and clean up
    const title = firstMessage.trim().substring(0, 50);
    return title.length < firstMessage.trim().length ? title + "..." : title;
  }

  // RAG: Ingestion stub - text only, no real embedding yet
  async ingestTextDocument(params: {
    userId: string;
    conversationId?: string;
    filename: string;
    mimeType: string;
    content: string;
  }) {
    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to ingest document");
      return await res.json();
    } catch (e) {
      console.error("ingestTextDocument error", e);
      throw e;
    }
  }

  // RAG: Retrieval - returns top chunks' text using direct database access
  async retrieveContext(params: {
    query: string;
    conversationId?: string;
    topK?: number;
  }) {
    try {
      // Use direct database access instead of API call to avoid auth issues
      const { query, topK = 3 } = params;

      // Get embedding for the query
      const embeddingRes = await fetch(`${process.env.EMBEDDING_API_URL || 'http://localhost:8000'}/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });

      if (!embeddingRes.ok) {
        throw new Error(`Embedding failed: ${embeddingRes.status}`);
      }

      const { embedding } = await embeddingRes.json();

      // Use direct database query for vector similarity search
      const { db } = await import("$lib/server/db");
      const { ragDocumentChunks, ragDocumentEmbeddings } = await import("$lib/server/db/schema");
      const { sql } = await import("drizzle-orm");

      const rows = await db.execute(
        sql`SELECT c.id, c.content, 1 - (e.embedding <#> ${embedding}::vector) AS score
            FROM rag_document_embeddings e
            JOIN rag_document_chunks c ON c.id = e.chunk_id
            ORDER BY (e.embedding <#> ${embedding}::vector) ASC
            LIMIT ${topK}`
      );

      const contexts = (rows as any[]).map((r) => ({
        id: r.id,
        content: r.content,
        score: Number(r.score),
      }));

      return { contexts };
    } catch (e) {
      console.error("retrieveContext error", e);
      // Return empty contexts instead of throwing to prevent streaming failure
      return { contexts: [] };
    }
  }
}

// Export singleton instance
export const databaseChatService = new DatabaseChatService();
