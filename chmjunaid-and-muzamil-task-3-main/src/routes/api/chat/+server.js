import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, and, asc, desc } from 'drizzle-orm';
import { createAndSaveMessageEmbedding, createAndSaveConversationEmbedding } from '$lib/repositories/embeddingRepository.js';
import { fullDocumentProcessor } from '$lib/services/documentProcessor.js';

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

    const { message, conversationId } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
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
      const conversationTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId,
          title: conversationTitle
        })
        .returning();
      
      currentConversationId = newConversation.id;
      
      // Create embedding for the new conversation title
      try {
        await createAndSaveConversationEmbedding(currentConversationId, conversationTitle);
      } catch (error) {
        console.error('Failed to create conversation embedding:', error);
        // Continue without embedding if it fails
      }
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

    // Determine parentId as the last active message in this conversation (for proper threading)
    const lastActiveMessage = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, currentConversationId),
          eq(messages.isActive, true)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1)
      .then(res => res[0]);

    // Save user message to database with parentId and mark active
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId: currentConversationId,
        content: message,
        role: 'user',
        parentId: lastActiveMessage ? lastActiveMessage.id : null,
        isActive: true,
        versionNumber: 1
      })
      .returning();
    
    // Create embedding for the user message
    try {
      await createAndSaveMessageEmbedding(userMessage.id, message);
    } catch (error) {
      console.error('Failed to create user message embedding:', error);
      // Continue without embedding if it fails
    }

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, currentConversationId));

    // Get active conversation history (limit to last 50 active messages)
    const activeMessagesDesc = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, currentConversationId),
          eq(messages.isActive, true)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Reverse to get chronological order (oldest first)
    const conversationHistory = [...activeMessagesDesc].reverse();

    // Search for relevant document chunks using conversation-scoped RAG
    let relevantChunks = [];
    let citations = [];
    try {
      console.log('🔍 Searching documents for query:', message, 'in conversation:', currentConversationId);
      const searchResults = await fullDocumentProcessor.searchDocuments(message, currentConversationId, 5, 0.3); // Lower threshold, more results
      console.log('📊 Search results:', searchResults.length, 'chunks found');

      relevantChunks = searchResults;

      // Create citations for the found chunks
      citations = relevantChunks.map((chunk, index) => ({
        index: index + 1,
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
        similarity: chunk.similarity
      }));

      console.log('📝 Citations created:', citations.length);
    } catch (error) {
      console.error('❌ Error searching documents:', error);
      // Continue without RAG if document search fails
    }

    // Prepare context from relevant documents
    let contextMessage = '';
    if (relevantChunks.length > 0) {
      console.log('📄 Adding RAG context with', relevantChunks.length, 'chunks');
      contextMessage = '\n\nRelevant information from your documents:\n' +
        relevantChunks.map((chunk, index) =>
          `[${index + 1}] ${chunk.content}`
        ).join('\n\n') +
        '\n\nPlease use this information to provide accurate and contextual responses.';

      console.log('📝 Context message length:', contextMessage.length);
    } else {
      console.log('⚠️ No relevant document chunks found for query');
    }

    // Enhanced user message with context
    const enhancedMessage = message + contextMessage;
    console.log('💬 Sending enhanced message to AI, length:', enhancedMessage.length);

    // Format conversation history for Gemini
    const chatHistory = conversationHistory
      .filter(msg => msg.role !== 'assistant' || msg.content.trim()) // Filter out empty assistant messages
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start a chat session with the conversation history
          const chat = model.startChat({
            history: chatHistory.slice(0, -1) // Exclude the current user message from history
          });

          // Generate content with streaming using the enhanced message (with context)
          const result = await chat.sendMessageStream(enhancedMessage);
          
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
          if (fullResponse) {
            const [aiMessage] = await db
              .insert(messages)
              .values({
                conversationId: currentConversationId,
                content: fullResponse,
                role: 'assistant',
                parentId: userMessage.id,
                isActive: true,
                versionNumber: 1
              })
              .returning();
            
            // Create embedding for the AI response
            try {
              await createAndSaveMessageEmbedding(aiMessage.id, fullResponse);
            } catch (error) {
              console.error('Failed to create AI message embedding:', error);
              // Continue without embedding if it fails
            }
          }
          
          // Send completion signal with citations
          const completionData = JSON.stringify({
            type: 'complete',
            conversationId: currentConversationId,
            citations: citations.length > 0 ? citations : null,
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
