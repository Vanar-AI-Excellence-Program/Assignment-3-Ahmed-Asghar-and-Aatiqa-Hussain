import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { conversations, messages, messageEmbeddings } from '$lib/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { createEmbedding, findSimilarMessages } from '$lib/embedding.js';

export async function POST({ request, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, conversationId, limit = 10, threshold = 0.7 } = await request.json();
    
    if (!query) {
      return json({ error: 'Query is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Create embedding for the search query
    const { embedding: queryEmbedding } = await createEmbedding(query);

    // Get message embeddings for the user's conversations
    let messageEmbeddingsQuery = db
      .select({
        id: messages.id,
        content: messages.content,
        role: messages.role,
        conversationId: messages.conversationId,
        createdAt: messages.createdAt,
        embedding: messageEmbeddings.embedding
      })
      .from(messages)
      .innerJoin(messageEmbeddings, eq(messages.id, messageEmbeddings.messageId))
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.userId, userId));

    // Filter by conversation if specified
    if (conversationId) {
      messageEmbeddingsQuery = messageEmbeddingsQuery.where(eq(messages.conversationId, conversationId));
    }

    const messageEmbeddingsData = await messageEmbeddingsQuery;

    // Calculate similarities and find similar messages
    const similarMessages = findSimilarMessages(
      queryEmbedding,
      messageEmbeddingsData.map(msg => ({ id: msg.id, embedding: msg.embedding })),
      threshold,
      limit
    );

    // Get the full message data for similar messages
    const similarMessageIds = similarMessages.map(msg => msg.id);
    const results = messageEmbeddingsData
      .filter(msg => similarMessageIds.includes(msg.id))
      .map(msg => {
        const similarity = similarMessages.find(sm => sm.id === msg.id)?.similarity || 0;
        return {
          ...msg,
          similarity: similarity
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return json({
      results,
      query,
      totalResults: results.length,
      threshold,
      limit
    });

  } catch (error) {
    console.error('Search error:', error);
    return json({ 
      error: 'Search failed',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET({ url, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = url.searchParams.get('q');
    const conversationId = url.searchParams.get('conversationId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.7');

    if (!query) {
      return json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Create embedding for the search query
    const { embedding: queryEmbedding } = await createEmbedding(query);

    // Get message embeddings for the user's conversations
    let messageEmbeddingsQuery = db
      .select({
        id: messages.id,
        content: messages.content,
        role: messages.role,
        conversationId: messages.conversationId,
        createdAt: messages.createdAt,
        embedding: messageEmbeddings.embedding
      })
      .from(messages)
      .innerJoin(messageEmbeddings, eq(messages.id, messageEmbeddings.messageId))
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.userId, userId));

    // Filter by conversation if specified
    if (conversationId) {
      messageEmbeddingsQuery = messageEmbeddingsQuery.where(eq(messages.conversationId, conversationId));
    }

    const messageEmbeddingsData = await messageEmbeddingsQuery;

    // Calculate similarities and find similar messages
    const similarMessages = findSimilarMessages(
      queryEmbedding,
      messageEmbeddingsData.map(msg => ({ id: msg.id, embedding: msg.embedding })),
      threshold,
      limit
    );

    // Get the full message data for similar messages
    const similarMessageIds = similarMessages.map(msg => msg.id);
    const results = messageEmbeddingsData
      .filter(msg => similarMessageIds.includes(msg.id))
      .map(msg => {
        const similarity = similarMessages.find(sm => sm.id === msg.id)?.similarity || 0;
        return {
          ...msg,
          similarity: similarity
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return json({
      results,
      query,
      totalResults: results.length,
      threshold,
      limit
    });

  } catch (error) {
    console.error('Search error:', error);
    return json({ 
      error: 'Search failed',
      details: error.message 
    }, { status: 500 });
  }
}
