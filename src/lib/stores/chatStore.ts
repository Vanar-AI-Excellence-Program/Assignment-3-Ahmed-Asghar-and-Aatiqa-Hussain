import { writable, get } from "svelte/store";
import {
  clientChatService,
  type ChatMessage as ClientChatMessage,
} from "$lib/services/clientChatService";
import {
  databaseChatService,
  type ChatConversation,
  type ChatMessage,
} from "$lib/services/databaseChatService";

// Note: File processing is now handled by the server-side API for memory efficiency

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  error: string | null;
  currentChatId: string | null;
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  currentCitations: any[];
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isStreaming: false,
  error: null,
  currentChatId: null,
  conversations: [],
  currentConversation: null,
  currentCitations: [],
};

function createChatStore() {
  const { subscribe, set, update } = writable<ChatState>(initialState);

  return {
    subscribe,

    // Load conversations from database
    async loadConversations() {
      try {
        const conversations = await databaseChatService.getConversations();
        update((state) => ({
          ...state,
          conversations,
        }));
      } catch (error) {
        console.error("Error loading conversations:", error);
        update((state) => ({
          ...state,
          error: "Failed to load conversations",
        }));
      }
    },

    // Load messages for a conversation
    async loadMessages(conversationId: string) {
      try {
        const messages = await databaseChatService.getMessages(conversationId);
        update((state) => ({
          ...state,
          messages,
          currentChatId: conversationId,
          error: null, // Clear any previous errors
        }));

        // Save current chat ID to localStorage
        try {
          localStorage.setItem("currentChatId", conversationId);
        } catch (error) {
          console.log("Could not save to localStorage:", error);
        }

        // Trigger scroll to bottom after loading messages
        setTimeout(() => {
          const scrollContainer = document.querySelector(
            "[data-radix-scroll-area-viewport]"
          );
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error("Error loading messages:", error);
        // Only show error if it's not a 404 (conversation not found)
        if (error instanceof Error && !error.message.includes("404")) {
          update((state) => ({
            ...state,
            error: "Failed to load messages",
          }));
        } else {
          // If conversation not found, just clear the current chat
          update((state) => ({
            ...state,
            messages: [],
            currentChatId: null,
            currentConversation: null,
            error: null,
          }));

          // Clear localStorage if conversation not found
          try {
            localStorage.removeItem("currentChatId");
          } catch (error) {
            console.log("Could not clear localStorage:", error);
          }
        }
      }
    },

    // Create a new conversation
    async createConversation(title: string) {
      try {
        const conversation = await databaseChatService.createConversation({
          title,
        });
        update((state) => ({
          ...state,
          conversations: [conversation, ...state.conversations],
          currentConversation: conversation,
          currentChatId: conversation.id,
          messages: [],
        }));

        // Save current chat ID to localStorage
        try {
          localStorage.setItem("currentChatId", conversation.id);
        } catch (error) {
          console.log("Could not save to localStorage:", error);
        }

        return conversation;
      } catch (error) {
        console.error("Error creating conversation:", error);
        update((state) => ({
          ...state,
          error: "Failed to create conversation",
        }));
        throw error;
      }
    },

    // Delete a conversation
    async deleteConversation(conversationId: string) {
      try {
        await databaseChatService.deleteConversation(conversationId);
        update((state) => ({
          ...state,
          conversations: state.conversations.filter(
            (conv) => conv.id !== conversationId
          ),
          currentConversation:
            state.currentConversation?.id === conversationId
              ? null
              : state.currentConversation,
          currentChatId:
            state.currentChatId === conversationId ? null : state.currentChatId,
          messages:
            state.currentChatId === conversationId ? [] : state.messages,
        }));

        // Clear localStorage if we deleted the current chat
        const currentState = get(this);
        if (currentState.currentChatId === null) {
          try {
            localStorage.removeItem("currentChatId");
          } catch (error) {
            console.log("Could not clear localStorage:", error);
          }
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
        update((state) => ({
          ...state,
          error: "Failed to delete conversation",
        }));
        throw error;
      }
    },

    // Rename a conversation
    async renameConversation(conversationId: string, newTitle: string) {
      try {
        const renamed = await databaseChatService.renameConversation(
          conversationId,
          newTitle,
          false // Manual rename, not auto-renamed
        );

        update((state) => ({
          ...state,
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? renamed : conv
          ),
          currentConversation:
            state.currentConversation?.id === conversationId
              ? renamed
              : state.currentConversation,
        }));

        return renamed;
      } catch (error) {
        console.error("Error renaming conversation:", error);
        update((state) => ({
          ...state,
          error: "Failed to rename conversation",
        }));
        throw error;
      }
    },

    // Send a message and get AI response
    async sendMessage(content: string, file?: File) {
      if (!content.trim() && !file) return;

      update((state) => ({
        ...state,
        isTyping: true,
        isStreaming: true,
        error: null,
      }));

      let conversationId = null;
      let isFirstMessageOfConversation = false;

      // If no current conversation, create a new one
      update((state) => {
        if (!state.currentChatId) {
          conversationId = null; // Will be created immediately as "New Chat"
          isFirstMessageOfConversation = true;
        } else {
          conversationId = state.currentChatId;
        }
        return state;
      });

      // If starting a new conversation, create it immediately with title "New Chat"
      if (!conversationId) {
        try {
          const conversation = await databaseChatService.createConversation({
            title: "New Chat",
          });
          conversationId = conversation.id;
          update((state) => ({
            ...state,
            conversations: [conversation, ...state.conversations],
            currentConversation: conversation,
            currentChatId: conversation.id,
          }));
        } catch (error) {
          console.error("Error creating conversation:", error);
        }
      }

      // Add user message to UI with real database ID
      let displayContent = content;
      let attachedFile = null;
      if (file) {
        displayContent = content || "Uploaded file";
        attachedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
        };
      }

      // Save user message to database first to get real ID
      let savedUserMessage = null;
      if (conversationId) {
        try {
          // For display purposes, only save the user's question
          // The file content will be handled separately for AI processing
          let dbDisplayContent = content || "Uploaded file";

          savedUserMessage = await databaseChatService.saveMessage({
            conversationId,
            role: "user",
            content: dbDisplayContent,
            attachedFile: attachedFile || undefined,
          });
        } catch (error) {
          console.error("Error saving user message:", error);
        }
      }

      // Use saved message or create a temporary one for display
      const userMessage = savedUserMessage || {
        id: Date.now().toString(),
        conversationId: conversationId || "",
        role: "user" as const,
        content: displayContent,
        timestamp: new Date(),
        attachedFile: attachedFile || undefined,
      };

      update((state) => ({
        ...state,
        messages: [...state.messages, userMessage],
      }));

      // Add placeholder AI message
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        conversationId: conversationId || "",
        role: "assistant" as const,
        content: "",
        timestamp: new Date(),
      };
      update((state) => ({
        ...state,
        messages: [...state.messages, aiMessage],
      }));

      try {
        // Get active conversation history from database to ensure we have the current state
        let conversationHistory: ChatMessage[] = [];
        if (conversationId) {
          try {
            // Reload messages from database to get current active state
            const activeMessages = await databaseChatService.getMessages(
              conversationId
            );
            conversationHistory = activeMessages;
          } catch (error) {
            console.error("Error loading active messages:", error);
            // Fallback to store messages
            update((state) => {
              conversationHistory = state.messages.slice(0, -1);
              return state;
            });
          }
        } else {
          // For new conversations, use store messages
          update((state) => {
            conversationHistory = state.messages.slice(0, -1);
            return state;
          });
        }

        // Stream AI response
        let accumulatedContent = "";
        let citations: any[] = [];

        // Prepare message for AI (RAG-enhanced in the API; keep prompt minimal)
        let messageForAI =
          content ||
          "Please answer based on my uploaded documents if relevant.";

        // If a file is present, use the file upload API for memory-efficient processing
        if (file) {
          try {
            console.log(
              "RAG ingest: using file upload API for memory-efficient processing"
            );

            // Use the file upload API instead of processing locally
            const formData = new FormData();
            formData.append("message", content || "");
            formData.append("file", file);
            formData.append(
              "conversationHistory",
              JSON.stringify(conversationHistory)
            );
            formData.append("conversationId", conversationId || "");
            formData.append("model", "gemini-2.5-pro");

            const response = await fetch("/api/chat/file-upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`File upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            accumulatedContent = result.response;

            // Update the AI message content
            update((state) => ({
              ...state,
              messages: state.messages.map((msg, index) =>
                index === state.messages.length - 1
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ),
              isTyping: false,
              isStreaming: false,
            }));

            // Save AI response to database
            if (conversationId) {
              try {
                await databaseChatService.saveMessage({
                  conversationId,
                  role: "assistant",
                  content: accumulatedContent,
                });
                await this.loadMessages(conversationId);
              } catch (error) {
                console.error("Error saving AI response:", error);
              }
            }

            // Apply citations from server result (if provided)
            if (result.citations && Array.isArray(result.citations)) {
              update((state) => ({
                ...state,
                currentCitations: result.citations,
              }));
            }

            // If this was the first message of a new conversation and it included a file,
            // rename the conversation to the document name
            if (isFirstMessageOfConversation && conversationId && file?.name) {
              try {
                const rawName = file.name;
                const dotIndex = rawName.lastIndexOf(".");
                const baseName =
                  dotIndex > 0 ? rawName.slice(0, dotIndex) : rawName;
                const title = baseName.trim().substring(0, 60);
                const renamed = await databaseChatService.renameConversation(
                  conversationId,
                  title || "Uploaded Document",
                  true
                );

                update((state) => ({
                  ...state,
                  conversations: [
                    renamed,
                    ...state.conversations.filter((c) => c.id !== renamed.id),
                  ],
                  currentConversation:
                    state.currentConversation?.id === renamed.id
                      ? renamed
                      : state.currentConversation,
                }));
              } catch (renameError) {
                console.error(
                  "Error auto-renaming conversation from document:",
                  renameError
                );
              }
            }

            return; // Exit early for file processing
          } catch (error) {
            console.error("File upload error:", error);
            accumulatedContent =
              "Sorry, I encountered an error processing your file. Please try again.";

            update((state) => ({
              ...state,
              messages: state.messages.map((msg, index) =>
                index === state.messages.length - 1
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ),
              isTyping: false,
              isStreaming: false,
            }));
            return;
          }
        }

        // Send the message to the AI (only for non-file messages)
        for await (const chunk of clientChatService.sendStreamingMessage(
          messageForAI,
          conversationHistory
        )) {
          if (chunk.type === "chunk" && chunk.content) {
            accumulatedContent += chunk.content;

            // Update the AI message content
            update((state) => ({
              ...state,
              messages: state.messages.map((msg, index) =>
                index === state.messages.length - 1
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ),
            }));

            // Trigger scroll to bottom for streaming content
            setTimeout(() => {
              const scrollContainer = document.querySelector(
                "[data-radix-scroll-area-viewport]"
              );
              if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
              }
            }, 10);
          } else if (chunk.type === "complete") {
            // Store citations if provided
            if (
              "citations" in chunk &&
              chunk.citations &&
              Array.isArray(chunk.citations)
            ) {
              citations = chunk.citations;
            }

            // Finalize the message
            update((state) => ({
              ...state,
              messages: state.messages.map((msg, index) =>
                index === state.messages.length - 1
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ),
              currentCitations: citations,
              isTyping: false,
              isStreaming: false,
            }));

            // Auto-rename only once after first AI response if conversation was just created
            if (isFirstMessageOfConversation && conversationId) {
              try {
                // Extract keywords from user message for better title
                const keywords = this.extractKeywords(content);
                const autoTitle =
                  keywords.length > 0
                    ? keywords
                    : databaseChatService.generateConversationTitle(content);

                const renamed = await databaseChatService.renameConversation(
                  conversationId,
                  autoTitle,
                  true
                );
                update((state) => ({
                  ...state,
                  conversations: [
                    renamed,
                    ...state.conversations.filter((c) => c.id !== renamed.id),
                  ],
                  currentConversation:
                    state.currentConversation?.id === renamed.id
                      ? renamed
                      : state.currentConversation,
                }));
              } catch (error) {
                console.error("Error auto-renaming conversation:", error);
              }
            }

            // Save AI response to database, then refresh messages to ensure IDs are DB-backed
            if (conversationId) {
              try {
                await databaseChatService.saveMessage({
                  conversationId,
                  role: "assistant",
                  content: accumulatedContent,
                });
                // Always reload messages after saving to get proper database IDs
                await this.loadMessages(conversationId);
              } catch (error) {
                console.error("Error saving/syncing AI message:", error);
                // Even if save fails, reload to show current state
                try {
                  await this.loadMessages(conversationId);
                } catch (reloadError) {
                  console.error("Error reloading messages:", reloadError);
                }
              }
            }

            break;
          } else if (chunk.type === "error") {
            throw new Error(chunk.error || "Unknown error occurred");
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";

        // Update the AI message with error
        update((state) => ({
          ...state,
          messages: state.messages.map((msg, index) =>
            index === state.messages.length - 1
              ? {
                  ...msg,
                  content: `Sorry, I encountered an error: ${errorMessage}`,
                }
              : msg
          ),
          error: errorMessage,
          isTyping: false,
          isStreaming: false,
        }));
      }
    },

    // Regenerate AI response for a message
    async regenerateMessage(messageId: string) {
      try {
        // Find the message to regenerate
        const currentState = get(this);
        const messageIndex = currentState.messages.findIndex(
          (msg) => msg.id === messageId
        );

        if (messageIndex === -1) {
          throw new Error("Message not found");
        }

        const message = currentState.messages[messageIndex];

        // If it's an assistant message, find the parent user message
        let userMessageId = messageId;
        if (message.role === "assistant" && message.parentId) {
          userMessageId = message.parentId;
        }

        // Set streaming state
        update((state) => ({
          ...state,
          isStreaming: true,
          isTyping: true,
        }));

        // Make streaming request to regenerate endpoint
        const response = await fetch(
          `/api/chat/messages/${userMessageId}/regenerate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            for (const line of text.split("\n")) {
              if (!line.trim()) continue;

              try {
                const data = JSON.parse(line);

                if (data.type === "chunk") {
                  accumulatedContent += data.content;

                  // Update the assistant message content in real-time
                  update((state) => ({
                    ...state,
                    messages: state.messages.map((msg, index) =>
                      index === messageIndex && msg.role === "assistant"
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    ),
                  }));

                  // Trigger scroll to bottom for streaming content
                  setTimeout(() => {
                    const scrollContainer = document.querySelector(
                      "[data-radix-scroll-area-viewport]"
                    );
                    if (scrollContainer) {
                      scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    }
                  }, 10);
                } else if (data.type === "complete") {
                  // Finalize the message
                  update((state) => ({
                    ...state,
                    messages: state.messages.map((msg, index) =>
                      index === messageIndex && msg.role === "assistant"
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    ),
                    isTyping: false,
                    isStreaming: false,
                  }));

                  // Reload messages to get updated tree structure with proper IDs
                  if (currentState.currentChatId) {
                    await this.loadMessages(currentState.currentChatId);
                  }
                } else if (data.type === "error") {
                  update((state) => ({
                    ...state,
                    messages: state.messages.map((msg, index) =>
                      index === messageIndex && msg.role === "assistant"
                        ? {
                            ...msg,
                            content:
                              "Sorry, I encountered an error while regenerating. Please try again.",
                          }
                        : msg
                    ),
                    isTyping: false,
                    isStreaming: false,
                  }));
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error("Error regenerating message:", error);
        update((state) => ({
          ...state,
          error: "Failed to regenerate message",
          isTyping: false,
          isStreaming: false,
        }));
        throw error;
      }
    },

    // Get message versions
    async getMessageVersions(messageId: string) {
      try {
        return await databaseChatService.getMessageVersions(messageId);
      } catch (error) {
        console.error("Error getting message versions:", error);
        throw error;
      }
    },

    // Switch message version
    async switchMessageVersion(
      messageId: string,
      targetMessageId?: string,
      direction?: "next" | "prev"
    ) {
      try {
        const result = await databaseChatService.switchMessageVersion(
          messageId,
          targetMessageId,
          direction
        );

        // Reload messages to get updated tree structure
        const currentState = get(this);
        if (currentState.currentChatId) {
          await this.loadMessages(currentState.currentChatId);
        }

        return result;
      } catch (error) {
        console.error("Error switching message version:", error);
        update((state) => ({
          ...state,
          error: "Failed to switch message version",
        }));
        throw error;
      }
    },

    // Edit a user message
    async editMessage(messageId: string, content: string) {
      try {
        // Set streaming state so UI disables send/regenerate and shows generating marker
        update((state) => ({
          ...state,
          isStreaming: true,
          isTyping: true,
        }));

        // First, check if this is a temporary ID (starts with timestamp)
        const isTemporaryId = /^\d{13}/.test(messageId);

        if (isTemporaryId) {
          // For temporary IDs, reload messages first to get real IDs
          const currentState = get(this);
          if (currentState.currentChatId) {
            await this.loadMessages(currentState.currentChatId);

            // Find the message with the same content to get the real ID
            const currentMessages = get(this).messages;
            const messageToEdit = currentMessages.find(
              (msg) =>
                msg.role === "user" &&
                msg.content === content &&
                msg.id !== messageId
            );

            if (messageToEdit) {
              // Try editing with the real database ID
              const result = await databaseChatService.editMessage(
                messageToEdit.id,
                content
              );
              await this.loadMessages(currentState.currentChatId);
              return result;
            } else {
              // If we can't find the message, just reload to show current state
              await this.loadMessages(currentState.currentChatId);
              return null;
            }
          }
        } else {
          // For real database IDs, try normal edit
          const result = await databaseChatService.editMessage(
            messageId,
            content
          );

          // Reload messages to get updated tree structure
          const currentState = get(this);
          if (currentState.currentChatId) {
            await this.loadMessages(currentState.currentChatId);
          }

          return result;
        }
      } catch (error: any) {
        console.error("Error editing message:", error);

        // If 404 likely due to temp ID, reload and retry once
        const is404 =
          error &&
          typeof error.message === "string" &&
          /404/.test(error.message);
        if (is404) {
          try {
            const currentState = get(this);
            if (currentState.currentChatId) {
              // First reload to get proper message IDs from database
              await this.loadMessages(currentState.currentChatId);

              // Find the message with the same content to get the real ID
              const currentMessages = get(this).messages;
              const messageToEdit = currentMessages.find(
                (msg) =>
                  msg.role === "user" &&
                  msg.content === content &&
                  msg.id !== messageId
              );

              if (messageToEdit) {
                // Try editing with the real database ID
                const retry = await databaseChatService.editMessage(
                  messageToEdit.id,
                  content
                );
                await this.loadMessages(currentState.currentChatId);
                return retry;
              } else {
                // If we can't find the message, just reload to show current state
                await this.loadMessages(currentState.currentChatId);
                return null;
              }
            }
          } catch (retryErr) {
            console.error("Retry edit failed:", retryErr);
            // Just reload to show current state
            const currentState = get(this);
            if (currentState.currentChatId) {
              await this.loadMessages(currentState.currentChatId);
            }
          }
        } else {
          // For non-404 errors, show error but don't break the chat
          update((state) => ({
            ...state,
            error: "Failed to edit message",
          }));
        }

        throw error;
      } finally {
        // Clear streaming state after edit flow settles
        update((state) => ({
          ...state,
          isStreaming: false,
          isTyping: false,
        }));
      }
    },

    // Start a new conversation
    startNewConversation() {
      update((state) => ({
        ...state,
        messages: [],
        currentChatId: null,
        currentConversation: null,
        error: null,
        isTyping: false,
        isStreaming: false,
      }));

      // Clear localStorage when starting new conversation
      try {
        localStorage.removeItem("currentChatId");
      } catch (error) {
        console.log("Could not clear localStorage:", error);
      }
    },

    // Extract meaningful keywords from user message
    extractKeywords(text: string): string {
      // Remove common words and extract meaningful terms
      const commonWords = [
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "can",
        "must",
        "shall",
        "i",
        "you",
        "he",
        "she",
        "it",
        "we",
        "they",
        "me",
        "him",
        "her",
        "us",
        "them",
        "this",
        "that",
        "these",
        "those",
        "my",
        "your",
        "his",
        "her",
        "its",
        "our",
        "their",
        "what",
        "when",
        "where",
        "why",
        "how",
        "who",
        "which",
        "whom",
        "whose",
      ];

      // Clean and split text
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ") // Remove punctuation
        .split(/\s+/)
        .filter((word) => word.length > 2) // Only words longer than 2 characters
        .filter((word) => !commonWords.includes(word)); // Remove common words

      // Get unique words and limit to 3-4 keywords
      const uniqueWords = [...new Set(words)];
      const keywords = uniqueWords.slice(0, 4);

      // Join keywords with spaces and capitalize first letter of each word
      return keywords
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },

    // Clear the chat (legacy method for compatibility)
    clearChat() {
      this.startNewConversation();
    },

    // Clear error
    clearError() {
      update((state) => ({
        ...state,
        error: null,
      }));
    },

    // Set current chat ID
    setCurrentChatId(chatId: string) {
      update((state) => ({
        ...state,
        currentChatId: chatId,
      }));
    },

    // Reset to initial state
    reset() {
      set(initialState);
    },
  };
}

export const chatStore = createChatStore();
