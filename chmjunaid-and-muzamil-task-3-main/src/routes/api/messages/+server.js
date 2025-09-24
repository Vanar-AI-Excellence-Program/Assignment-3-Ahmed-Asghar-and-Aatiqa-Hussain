import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, and, asc, desc } from 'drizzle-orm';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// Character-by-character streaming configuration
const STREAMING_CONFIG = {
  CHAR_DELAY: 12, // Base delay per character in milliseconds (reduced for smoother flow)
  WORD_DELAY: 25, // Additional delay after words (spaces) (reduced)
  SENTENCE_DELAY: 120, // Additional delay after sentences (reduced)
  PARAGRAPH_DELAY: 250, // Additional delay after paragraphs (reduced)
  CODE_BLOCK_DELAY: 80, // Additional delay for code blocks (reduced)
  SENTENCE_ENDINGS: ['.', '!', '?', ':', ';'],
  PARAGRAPH_ENDINGS: ['\n\n', '\r\n\r\n'],
  WORD_BOUNDARIES: [' ', '\t', '\n'],
  PUNCTUATION: [',', ';', ':', '-', '—', '(', ')', '[', ']', '{', '}']
};

// Helper function to calculate delay for each character
function calculateCharacterDelay(char, prevChar, nextChar) {
  let delay = STREAMING_CONFIG.CHAR_DELAY;
  
  // Add extra delay after sentence endings
  if (STREAMING_CONFIG.SENTENCE_ENDINGS.includes(char)) {
    delay += STREAMING_CONFIG.SENTENCE_DELAY;
  }
  // Add delay after word boundaries (spaces, tabs, newlines)
  else if (STREAMING_CONFIG.WORD_BOUNDARIES.includes(char)) {
    delay += STREAMING_CONFIG.WORD_DELAY;
  }
  // Add small delay after punctuation
  else if (STREAMING_CONFIG.PUNCTUATION.includes(char)) {
    delay += 15;
  }
  
  // Check for paragraph endings (double newlines)
  if (char === '\n' && prevChar === '\n') {
    delay += STREAMING_CONFIG.PARAGRAPH_DELAY;
  }
  
  // Reduce delay for consecutive letters (faster typing within words)
  if (char.match(/[a-zA-Z]/) && prevChar && prevChar.match(/[a-zA-Z]/)) {
    delay = Math.max(6, delay - 7); // Even faster for consecutive letters
  }
  
  // Very fast for numbers and symbols in sequence
  if (char.match(/[0-9]/) || char.match(/[^\w\s]/)) {
    delay = Math.max(5, delay - 3);
  }
  
  return delay;
}

// Helper function to stream text character by character
async function streamTextByCharacter(text, controller) {
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : null;
    const nextChar = i < text.length - 1 ? text[i + 1] : null;
    
    // Send the character
    const data = JSON.stringify({ 
      type: 'chunk', 
      content: char,
      timestamp: new Date().toISOString()
    }) + '\n';
    
    controller.enqueue(new TextEncoder().encode(data));
    
    // Calculate and apply delay
    const delay = calculateCharacterDelay(char, prevChar, nextChar);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export async function POST({ request, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { conversationId, content } = await request.json();
    
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.user.id;
    let currentConversationId = conversationId;

    // If no conversation ID provided, create a new conversation
    if (!currentConversationId) {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId,
          title: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        })
        .returning();
      
      currentConversationId = newConversation.id;
    } else {
      // Verify the conversation belongs to the user
      const conversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, currentConversationId),
            eq(conversations.userId, userId)
          )
        )
        .then(res => res[0]);

      if (!conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get the last message to set as parent
    const lastMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, currentConversationId))
      .orderBy(desc(messages.createdAt))
      .then(res => res[0]);

    // Create user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId: currentConversationId,
        content,
        role: 'user',
        parentId: lastMessage?.id || null,
        versionNumber: 1,
        isEdited: false,
        isActive: true
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, currentConversationId));

    // Get conversation context for GPT
    const conversationContext = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, currentConversationId))
      .orderBy(asc(messages.createdAt));

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start a chat session with the conversation history
          const chat = model.startChat({
            history: conversationContext.slice(0, -1) // Exclude the current user message from history
          });

          // Generate content with streaming using the current message
          const result = await chat.sendMessageStream(content);
          
          let fullResponse = '';
          
          // Stream the response character by character
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullResponse += chunkText;
              
              // Stream each character with appropriate delays
              await streamTextByCharacter(chunkText, controller);
            }
          }
          
          // Save AI response to database
          let assistantMessage = null;
          if (fullResponse) {
            [assistantMessage] = await db
              .insert(messages)
              .values({
                conversationId: currentConversationId,
                content: fullResponse,
                role: 'assistant',
                parentId: userMessage.id,
                versionNumber: 1,
                isEdited: false,
                isActive: true
              })
              .returning();
          }
          
          // Send completion signal
          const completionData = JSON.stringify({ 
            type: 'complete',
            conversationId: currentConversationId,
            userMessage,
            assistantMessage,
            timestamp: new Date().toISOString()
          }) + '\n';
          
          controller.enqueue(new TextEncoder().encode(completionData));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: 'Failed to generate response',
            details: error.message 
          }) + '\n';
          
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
