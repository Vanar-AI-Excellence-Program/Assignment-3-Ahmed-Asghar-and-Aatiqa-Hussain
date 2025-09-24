import { WebSocketServer } from 'ws';
import { db } from './db.js';
import { messages, conversations } from './schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';

class ChatWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map(); // Map of userId -> WebSocket
    this.conversationClients = new Map(); // Map of conversationId -> Set of userIds
    
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  handleConnection(ws, req) {
    console.log('New WebSocket connection');
    
    // Extract user info from request (you might need to adjust this based on your auth)
    const userId = this.extractUserId(req);
    if (!userId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Store client connection
    this.clients.set(userId, ws);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(userId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(userId);
      // Remove from conversation subscriptions
      for (const [conversationId, userIds] of this.conversationClients.entries()) {
        userIds.delete(userId);
        if (userIds.size === 0) {
          this.conversationClients.delete(conversationId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  extractUserId(req) {
    // Extract user ID from request headers or query params
    // This depends on your authentication setup
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // Parse JWT or session token to get userId
      // For now, we'll use a simple approach
      return req.headers['x-user-id'];
    }
    return null;
  }

  async handleMessage(userId, message) {
    switch (message.type) {
      case 'subscribe_conversation':
        await this.subscribeToConversation(userId, message.conversationId);
        break;
      case 'unsubscribe_conversation':
        await this.unsubscribeFromConversation(userId, message.conversationId);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  async subscribeToConversation(userId, conversationId) {
    if (!this.conversationClients.has(conversationId)) {
      this.conversationClients.set(conversationId, new Set());
    }
    this.conversationClients.get(conversationId).add(userId);
    
    // Send initial conversation data
    await this.sendConversationData(userId, conversationId);
  }

  async unsubscribeFromConversation(userId, conversationId) {
    const clients = this.conversationClients.get(conversationId);
    if (clients) {
      clients.delete(userId);
      if (clients.size === 0) {
        this.conversationClients.delete(conversationId);
      }
    }
  }

  async sendConversationData(userId, conversationId) {
    try {
      // Get all messages for the conversation
      const allMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));
      
      const data = {
        type: 'conversation_data',
        conversationId,
        messages: allMessages
      };
      
      this.sendToUser(userId, data);
    } catch (error) {
      console.error('Error sending conversation data:', error);
    }
  }

  sendToUser(userId, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(data));
    }
  }

  broadcastToConversation(conversationId, data) {
    const clients = this.conversationClients.get(conversationId);
    if (clients) {
      for (const userId of clients) {
        this.sendToUser(userId, data);
      }
    }
  }

  // Method to notify clients when a new message is added
  async notifyNewMessage(conversationId, message) {
    const data = {
      type: 'new_message',
      conversationId,
      message
    };
    
    this.broadcastToConversation(conversationId, data);
  }

  // Method to notify clients when a message is edited/regenerated
  async notifyMessageUpdate(conversationId, message, updateType) {
    const data = {
      type: 'message_update',
      conversationId,
      message,
      updateType // 'edit', 'regenerate'
    };
    
    this.broadcastToConversation(conversationId, data);
  }
}

export default ChatWebSocketServer;
