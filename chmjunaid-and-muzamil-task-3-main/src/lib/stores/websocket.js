import { writable } from 'svelte/store';

class WebSocketStore {
  constructor() {
    this.ws = null;
    this.isConnected = writable(false);
    this.currentConversationId = writable(null);
    this.messages = writable([]);
    
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    this.messageHandlers.set('conversation_data', this.handleConversationData.bind(this));
    this.messageHandlers.set('new_message', this.handleNewMessage.bind(this));
    this.messageHandlers.set('message_update', this.handleMessageUpdate.bind(this));
  }

  connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected.set(true);
      
      // Send user ID for authentication
      this.ws.send(JSON.stringify({
        type: 'auth',
        userId: userId
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected.set(false);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected.set(false);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected.set(false);
  }

  handleMessage(data) {
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    } else {
      console.log('Unknown message type:', data.type);
    }
  }

  handleConversationData(data) {
    this.currentConversationId.set(data.conversationId);
    this.messages.set(data.messages);
  }

  handleNewMessage(data) {
    // Add new message to current conversation
    this.messages.update(messages => [...messages, data.message]);
  }

  handleMessageUpdate(data) {
    // Update existing message
    this.messages.update(messages => {
      return messages.map(msg => 
        msg.id === data.message.id ? data.message : msg
      );
    });
  }

  subscribeToConversation(conversationId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_conversation',
        conversationId: conversationId
      }));
    }
  }

  unsubscribeFromConversation(conversationId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe_conversation',
        conversationId: conversationId
      }));
    }
  }
}

// Create singleton instance
const websocketStore = new WebSocketStore();

// Export stores for reactive components
export const isConnected = websocketStore.isConnected;
export const currentConversationId = websocketStore.currentConversationId;
export const messages = websocketStore.messages;

// Export methods
export const {
  connect,
  disconnect,
  subscribeToConversation,
  unsubscribeFromConversation
} = websocketStore;
