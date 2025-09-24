import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, and, asc, desc, or } from 'drizzle-orm';
import { checkRateLimit } from '$lib/utils.js';
import { sql } from 'drizzle-orm';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export async function PATCH({ request, locals, params }) {
  try {
    console.log('🔧 PATCH /api/messages/[id] called with params:', params);
    const session = await locals.getSession();
    if (!session?.user?.id) {
      console.log('❌ No session found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('✅ Session found, user ID:', session.user.id);

    const { content } = await request.json();
    const messageId = parseInt(params.id);
    console.log('📝 Request content:', content);
    console.log('📝 Message ID:', messageId);

    // Validate that the ID is a valid positive integer
    if (isNaN(messageId) || messageId <= 0 || messageId > 2147483647) {
      return new Response(JSON.stringify({
        error: 'Invalid message ID',
        details: `Message ID must be a valid positive integer, got: ${params.id}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Rate limiting: 5 edits per minute per user
    const rateLimitKey = `edit:${userId}`;
    if (!checkRateLimit(rateLimitKey, 5, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the original user message
    const originalMessage = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.role, 'user')
        )
      )
      .then(res => res[0]);

    if (!originalMessage) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, originalMessage.conversationId),
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

    // Don't create a new version if content hasn't changed
    if (content.trim() === originalMessage.content) {
      return new Response(JSON.stringify({ 
        message: 'No changes detected',
        editedMessage: originalMessage
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get versions in this group to compute next version number
    const groupVersions = await db
      .select()
      .from(messages)
      .where(eq(messages.versionGroupId, originalMessage.versionGroupId))
      .orderBy(desc(messages.versionNumber));

    const nextVersionNumber = (groupVersions[0]?.versionNumber || 0) + 1;

    // Deactivate all existing versions in the group
    await db
      .update(messages)
      .set({ isActive: false })
      .where(eq(messages.versionGroupId, originalMessage.versionGroupId));

    // Create a new version (branch) for the edited user message
    const [editedMessage] = await db
      .insert(messages)
      .values({
        conversationId: originalMessage.conversationId,
        content: content.trim(),
        role: 'user',
        parentId: originalMessage.parentId ?? null,
        versionGroupId: originalMessage.versionGroupId,
        versionNumber: nextVersionNumber,
        isEdited: true,
        isActive: true
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, originalMessage.conversationId));

    // Find descendants of previous versions to deactivate (branch pruning)
    const versionIds = groupVersions.map(v => v.id);
    let deactivatedIds = [];
    if (versionIds.length > 0) {
      // Collect descendants via recursive CTE
      const versionIdsStr = versionIds.join(',');
      const result = await db.execute(sql`
        WITH RECURSIVE descendants AS (
          SELECT id FROM message WHERE id = ANY(ARRAY[${sql.raw(versionIdsStr)}])
          UNION ALL
          SELECT m.id FROM message m
          JOIN descendants d ON m."parentId" = d.id
        )
        SELECT id FROM descendants WHERE id <> ALL(ARRAY[${sql.raw(versionIdsStr)}]);
      `);
      // Map result rows to ids depending on driver shape
      const rows = Array.isArray(result) ? result : result.rows;
      deactivatedIds = rows?.map(r => r.id) || [];
      if (deactivatedIds.length > 0) {
        const deactivatedIdsStr = deactivatedIds.join(',');
        await db.execute(sql`UPDATE message SET "isActive" = false WHERE id = ANY(ARRAY[${sql.raw(deactivatedIdsStr)}]);`);
      }
    }

    // Get active conversation context (exclude the just-created user message)
    const conversationContext = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, originalMessage.conversationId),
          eq(messages.isActive, true)
        )
      )
      .orderBy(asc(messages.createdAt));

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Format conversation history for Gemini (exclude the last user message)
          const history = conversationContext.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

          // Start a chat session with the properly formatted conversation history
          const chat = model.startChat({
            history: history
          });

          // Generate content with streaming using the edited message
          const result = await chat.sendMessageStream(content.trim());
          
          let fullResponse = '';
          
          // Stream the response chunks with optimized chunking
          let buffer = '';
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullResponse += chunkText;
              buffer += chunkText;
              
              // Process buffer in optimal chunks
              while (buffer.length >= 3) { // MIN_CHUNK_SIZE
                const maxChunkSize = 15; // MAX_CHUNK_SIZE
                let chunkEndIndex = Math.min(maxChunkSize, buffer.length);
                
                // Look for sentence endings first
                for (let i = chunkEndIndex - 1; i >= 3; i--) {
                  if (['.', '!', '?', ':', ';'].includes(buffer[i])) {
                    chunkEndIndex = i + 1;
                    break;
                  }
                }
                
                // Look for word boundaries
                if (chunkEndIndex === maxChunkSize) {
                  for (let i = chunkEndIndex - 1; i >= 3; i--) {
                    if (buffer[i] === ' ' || buffer[i] === '\n' || buffer[i] === '\t') {
                      chunkEndIndex = i + 1;
                      break;
                    }
                  }
                }
                
                const chunkContent = buffer.substring(0, chunkEndIndex);
                buffer = buffer.substring(chunkEndIndex);
                
                // Send the chunk
                const data = JSON.stringify({ 
                  type: 'chunk', 
                  content: chunkContent,
                  timestamp: new Date().toISOString()
                }) + '\n';
                
                controller.enqueue(new TextEncoder().encode(data));
                
                // Adaptive delay (2-8ms based on content)
                const delay = chunkContent.length > 10 ? 1 : 3;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
          
          // Send any remaining buffer content
          if (buffer.trim()) {
            const data = JSON.stringify({ 
              type: 'chunk', 
              content: buffer,
              timestamp: new Date().toISOString()
            }) + '\n';
            
            controller.enqueue(new TextEncoder().encode(data));
          }
          
          // Save new assistant response (first version in its group or continuation)
          let newAssistantReply = null;
          if (fullResponse) {
            [newAssistantReply] = await db
              .insert(messages)
              .values({
                conversationId: originalMessage.conversationId,
                content: fullResponse,
                role: 'assistant',
                parentId: editedMessage.id,
                versionNumber: 1,
                isEdited: false,
                isActive: true
              })
              .returning();
          }
          
          // Send completion signal
          const completionData = JSON.stringify({ 
            type: 'complete',
            editedMessage,
            newAssistantReply,
            deactivatedMessages: deactivatedIds,
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
    console.error('Edit message error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to edit message',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
