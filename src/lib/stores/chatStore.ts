import { writable } from "svelte/store";
import {
  clientChatService,
  type ChatMessage as ClientChatMessage,
} from "$lib/services/clientChatService";
import {
  databaseChatService,
  type ChatConversation,
  type ChatMessage,
} from "$lib/services/databaseChatService";

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  error: string | null;
  currentChatId: string | null;
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isStreaming: false,
  error: null,
  currentChatId: null,
  conversations: [],
  currentConversation: null,
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
        }));
      } catch (error) {
        console.error("Error loading messages:", error);
        update((state) => ({
          ...state,
          error: "Failed to load messages",
        }));
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
      } catch (error) {
        console.error("Error deleting conversation:", error);
        update((state) => ({
          ...state,
          error: "Failed to delete conversation",
        }));
      }
    },

    // Send a message and get AI response
    async sendMessage(content: string) {
      if (!content.trim()) return;

      update((state) => ({
        ...state,
        isTyping: true,
        isStreaming: true,
        error: null,
      }));

      let conversationId = null;

      // If no current conversation, create a new one
      update((state) => {
        if (!state.currentChatId) {
          conversationId = null; // Will be created after first message
        } else {
          conversationId = state.currentChatId;
        }
        return state;
      });

      // Add user message
      const userMessage = clientChatService.createMessage("user", content);
      update((state) => ({
        ...state,
        messages: [...state.messages, userMessage],
      }));

      // Save user message to database if we have a conversation
      if (conversationId) {
        try {
          await databaseChatService.saveMessage({
            conversationId,
            role: "user",
            content,
          });
        } catch (error) {
          console.error("Error saving user message:", error);
        }
      }

      // Add placeholder AI message
      const aiMessage = clientChatService.createMessage("assistant", "");
      update((state) => ({
        ...state,
        messages: [...state.messages, aiMessage],
      }));

      try {
        // Get conversation history (excluding the placeholder AI message)
        let conversationHistory: ChatMessage[] = [];
        update((state) => {
          conversationHistory = state.messages.slice(0, -1);
          return state;
        });

        // Stream AI response
        let accumulatedContent = "";
        let citations: Array<{ documentTitle?: string; documentSource?: string; score: number }> = [];
        
        for await (const chunk of clientChatService.sendStreamingMessage(
          content,
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
          } else if (chunk.type === "complete") {
            // Store citations for final message
            if (chunk.citations) {
              citations = chunk.citations;
            }
            
            // Finalize the message with citations
            update((state) => ({
              ...state,
              messages: state.messages.map((msg, index) =>
                index === state.messages.length - 1
                  ? { ...msg, content: accumulatedContent, citations }
                  : msg
              ),
              isTyping: false,
              isStreaming: false,
            }));

            // Create conversation if this is the first message
            if (!conversationId) {
              try {
                const title =
                  databaseChatService.generateConversationTitle(content);
                const conversation =
                  await databaseChatService.createConversation({ title });
                update((state) => ({
                  ...state,
                  conversations: [conversation, ...state.conversations],
                  currentConversation: conversation,
                  currentChatId: conversation.id,
                }));
                conversationId = conversation.id;
              } catch (error) {
                console.error("Error creating conversation:", error);
              }
            }

            // Save AI response to database
            if (conversationId) {
              try {
                await databaseChatService.saveMessage({
                  conversationId,
                  role: "assistant",
                  content: accumulatedContent,
                });
              } catch (error) {
                console.error("Error saving AI message:", error);
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
        const result = await databaseChatService.regenerateMessage(messageId);

        // Reload messages to get updated tree structure
        update((state) => {
          if (state.currentChatId) {
            this.loadMessages(state.currentChatId);
          }
          return state;
        });

        return result;
      } catch (error) {
        console.error("Error regenerating message:", error);
        update((state) => ({
          ...state,
          error: "Failed to regenerate message",
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
        update((state) => {
          if (state.currentChatId) {
            this.loadMessages(state.currentChatId);
          }
          return state;
        });

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
        const result = await databaseChatService.editMessage(
          messageId,
          content
        );

        // Reload messages to get updated tree structure
        update((state) => {
          if (state.currentChatId) {
            this.loadMessages(state.currentChatId);
          }
          return state;
        });

        return result;
      } catch (error) {
        console.error("Error editing message:", error);
        update((state) => ({
          ...state,
          error: "Failed to edit message",
        }));
        throw error;
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
