import { WebSocketServer } from 'ws';

let wss = null;
let clients = new Map(); // Map of userId -> WebSocket
let conversationClients = new Map(); // Map of conversationId -> Set of userIds

export function GET({ request }) {
  // This is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  
  if (upgrade !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }

  // Initialize WebSocket server if not already done
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    setupWebSocketHandlers();
  }

  // For SvelteKit, we need to handle this differently
  // This is a simplified version that works with the client-side WebSocket
  return new Response('WebSocket endpoint ready', { status: 200 });
}

function setupWebSocketHandlers() {
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    let userId = null;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'auth') {
          userId = message.userId;
          clients.set(userId, ws);
          console.log(`User ${userId} authenticated`);
        } else if (userId) {
          await handleMessage(userId, message, ws);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
        // Remove from conversation subscriptions
        for (const [conversationId, userIds] of conversationClients.entries()) {
          userIds.delete(userId);
          if (userIds.size === 0) {
            conversationClients.delete(conversationId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

async function handleMessage(userId, message, ws) {
  switch (message.type) {
    case 'subscribe_conversation':
      await subscribeToConversation(userId, message.conversationId, ws);
      break;
    case 'unsubscribe_conversation':
      await unsubscribeFromConversation(userId, message.conversationId);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}

async function subscribeToConversation(userId, conversationId, ws) {
  if (!conversationClients.has(conversationId)) {
    conversationClients.set(conversationId, new Set());
  }
  conversationClients.get(conversationId).add(userId);
  
  // Send initial conversation data
  await sendConversationData(userId, conversationId, ws);
}

async function unsubscribeFromConversation(userId, conversationId) {
  const clients = conversationClients.get(conversationId);
  if (clients) {
    clients.delete(userId);
    if (clients.size === 0) {
      conversationClients.delete(conversationId);
    }
  }
}

async function sendConversationData(userId, conversationId, ws) {
  try {
    // For now, send a simple response
    const data = {
      type: 'conversation_data',
      conversationId,
      messages: []
    };
    
    sendToUser(userId, data, ws);
  } catch (error) {
    console.error('Error sending conversation data:', error);
  }
}

function sendToUser(userId, data, ws) {
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(data));
  }
}

function broadcastToConversation(conversationId, data) {
  const clients = conversationClients.get(conversationId);
  if (clients) {
    for (const userId of clients) {
      const ws = clients.get(userId);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(data));
      }
    }
  }
}

// Note: These functions are not exported as they're not valid SvelteKit exports
// They can be called internally but not imported from other modules
function notifyNewMessage(conversationId, message) {
  const data = {
    type: 'new_message',
    conversationId,
    message
  };
  
  broadcastToConversation(conversationId, data);
}

function notifyMessageUpdate(conversationId, message, updateType) {
  const data = {
    type: 'message_update',
    conversationId,
    message,
    updateType // 'edit', 'regenerate'
  };
  
  broadcastToConversation(conversationId, data);
}
