import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { sql as rawSql } from 'drizzle-orm';
import { checkRateLimit } from '$lib/utils.js';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export async function POST({ request, locals, params }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const messageId = parseInt(params.id);

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

    const userId = session.user.id;

    // Rate limiting: 3 regenerations per minute per user
    const rateLimitKey = `regenerate:${userId}`;
    if (!checkRateLimit(rateLimitKey, 3, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the user message to regenerate response for
    const userMessage = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.role, 'user')
        )
      )
      .then(res => res[0]);

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'User message not found' }), {
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
          eq(conversations.id, userMessage.conversationId),
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

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find existing assistant response to this user message (active)
    const existingAssistantMessage = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.parentId, userMessage.id),
          eq(messages.role, 'assistant'),
          eq(messages.isActive, true)
        )
      )
      .orderBy(desc(messages.createdAt))
      .then(res => res[0]);

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, userMessage.conversationId));

    // Get active conversation context for GPT
    const conversationContext = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, userMessage.conversationId),
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
           // Format conversation history for Gemini (exclude current user message)
           const history = conversationContext.slice(0, -1).map(msg => ({
             role: msg.role === 'assistant' ? 'model' : 'user',
             parts: [{ text: msg.content }]
           }));

           // Start a chat session with the properly formatted conversation history
           const chat = model.startChat({
             history: history
           });

           // Generate content with streaming using the user message
           const result = await chat.sendMessageStream(userMessage.content);
          
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
          
          // Save new assistant response as a branch/version
          let regeneratedAssistantReply = null;
          let deactivatedIds = [];
          if (fullResponse) {
            if (existingAssistantMessage) {
              // Determine the version group and next version number
              const groupId = existingAssistantMessage.versionGroupId;
              const maxVersion = await db
                .select({ v: sql`MAX("versionNumber")`.as('v') })
                .from(messages)
                .where(eq(messages.versionGroupId, groupId))
                .then(res => (Array.isArray(res) ? res[0]?.v : res.rows?.[0]?.v) || 1);

              const nextVersionNumber = Number(maxVersion) + 1;

              // Deactivate all versions in this group and their descendants
              const groupIdsResult = await db.execute(sql`
                SELECT id FROM message WHERE "versionGroupId" = ${groupId}
              `);
              const groupIdsRows = Array.isArray(groupIdsResult) ? groupIdsResult : groupIdsResult.rows;
              const groupIds = groupIdsRows?.map(r => r.id) || [];

              if (groupIds.length > 0) {
                const idsStr = groupIds.join(',');
                const descendantsResult = await db.execute(sql`
                  WITH RECURSIVE descendants AS (
                    SELECT id FROM message WHERE id = ANY(ARRAY[${sql.raw(idsStr)}])
                    UNION ALL
                    SELECT m.id FROM message m
                    JOIN descendants d ON m."parentId" = d.id
                  )
                  SELECT id FROM descendants;
                `);
                const descRows = Array.isArray(descendantsResult) ? descendantsResult : descendantsResult.rows;
                deactivatedIds = descRows?.map(r => r.id) || [];
                if (deactivatedIds.length > 0) {
                  const deactivatedIdsStr = deactivatedIds.join(',');
                  await db.execute(sql`UPDATE message SET "isActive" = false WHERE id = ANY(ARRAY[${sql.raw(deactivatedIdsStr)}]);`);
                }
              }

              // Insert the new assistant reply into the same version group
              [regeneratedAssistantReply] = await db
                .insert(messages)
                .values({
                  conversationId: userMessage.conversationId,
                  content: fullResponse,
                  role: 'assistant',
                  parentId: userMessage.id,
                  versionGroupId: groupId,
                  versionNumber: nextVersionNumber,
                  isEdited: false,
                  isActive: true
                })
                .returning();
            } else {
              // No existing assistant version: create the first one
              [regeneratedAssistantReply] = await db
                .insert(messages)
                .values({
                  conversationId: userMessage.conversationId,
                  content: fullResponse,
                  role: 'assistant',
                  parentId: userMessage.id,
                  versionNumber: 1,
                  isEdited: false,
                  isActive: true
                })
                .returning();
            }
          }
          
          // Send completion signal
          const completionData = JSON.stringify({ 
            type: 'complete',
            regeneratedAssistantReply,
            deactivatedMessages: deactivatedIds,
            timestamp: new Date().toISOString()
          }) + '\n';
          
          controller.enqueue(new TextEncoder().encode(completionData));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: 'Failed to regenerate response',
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
    console.error('Regenerate response error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to regenerate response',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
