import { db } from '../db.js';
import { messageEmbeddings, conversationEmbeddings, messages, conversations } from '../schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { createEmbedding } from '../embedding.js';

/**
 * Save a message embedding to the database
 * @param {number} messageId - The message ID
 * @param {number[]} embedding - The embedding vector
 * @param {number} dimension - The embedding dimension
 * @returns {Promise<Object>} - The saved embedding record
 */
export async function saveMessageEmbedding(messageId, embedding, dimension) {
  try {
    const [result] = await db.insert(messageEmbeddings).values({
      messageId,
      embedding,
      dimension
    }).returning();
    
    return result;
  } catch (error) {
    console.error('Error saving message embedding:', error);
    throw new Error(`Failed to save message embedding: ${error.message}`);
  }
}

/**
 * Get embedding for a specific message
 * @param {number} messageId - The message ID
 * @returns {Promise<Object|null>} - The embedding record or null
 */
export async function getMessageEmbedding(messageId) {
  try {
    const [result] = await db
      .select()
      .from(messageEmbeddings)
      .where(eq(messageEmbeddings.messageId, messageId));
    
    return result || null;
  } catch (error) {
    console.error('Error getting message embedding:', error);
    throw new Error(`Failed to get message embedding: ${error.message}`);
  }
}

/**
 * Get embeddings for multiple messages
 * @param {number[]} messageIds - Array of message IDs
 * @returns {Promise<Array<Object>>} - Array of embedding records
 */
export async function getMessageEmbeddings(messageIds) {
  try {
    const results = await db
      .select()
      .from(messageEmbeddings)
      .where(inArray(messageEmbeddings.messageId, messageIds));
    
    return results;
  } catch (error) {
    console.error('Error getting message embeddings:', error);
    throw new Error(`Failed to get message embeddings: ${error.message}`);
  }
}

/**
 * Save a conversation embedding to the database
 * @param {number} conversationId - The conversation ID
 * @param {number[]} titleEmbedding - The title embedding vector
 * @param {number[]} summaryEmbedding - The summary embedding vector
 * @returns {Promise<Object>} - The saved embedding record
 */
export async function saveConversationEmbedding(conversationId, titleEmbedding = null, summaryEmbedding = null) {
  try {
    const [result] = await db.insert(conversationEmbeddings).values({
      conversationId,
      titleEmbedding,
      summaryEmbedding
    }).returning();
    
    return result;
  } catch (error) {
    console.error('Error saving conversation embedding:', error);
    throw new Error(`Failed to save conversation embedding: ${error.message}`);
  }
}

/**
 * Update conversation embedding
 * @param {number} conversationId - The conversation ID
 * @param {number[]} titleEmbedding - The title embedding vector
 * @param {number[]} summaryEmbedding - The summary embedding vector
 * @returns {Promise<Object>} - The updated embedding record
 */
export async function updateConversationEmbedding(conversationId, titleEmbedding = null, summaryEmbedding = null) {
  try {
    const [result] = await db
      .update(conversationEmbeddings)
      .set({
        titleEmbedding,
        summaryEmbedding,
        updatedAt: new Date()
      })
      .where(eq(conversationEmbeddings.conversationId, conversationId))
      .returning();
    
    return result;
  } catch (error) {
    console.error('Error updating conversation embedding:', error);
    throw new Error(`Failed to update conversation embedding: ${error.message}`);
  }
}

/**
 * Get conversation embedding
 * @param {number} conversationId - The conversation ID
 * @returns {Promise<Object|null>} - The embedding record or null
 */
export async function getConversationEmbedding(conversationId) {
  try {
    const [result] = await db
      .select()
      .from(conversationEmbeddings)
      .where(eq(conversationEmbeddings.conversationId, conversationId));
    
    return result || null;
  } catch (error) {
    console.error('Error getting conversation embedding:', error);
    throw new Error(`Failed to get conversation embedding: ${error.message}`);
  }
}

/**
 * Create and save embedding for a message
 * @param {number} messageId - The message ID
 * @param {string} content - The message content
 * @returns {Promise<Object>} - The saved embedding record
 */
export async function createAndSaveMessageEmbedding(messageId, content) {
  try {
    // Create embedding using the embedding service
    const { embedding, dim } = await createEmbedding(content);
    
    // Save to database
    const result = await saveMessageEmbedding(messageId, embedding, dim);
    
    return result;
  } catch (error) {
    console.error('Error creating and saving message embedding:', error);
    throw new Error(`Failed to create and save message embedding: ${error.message}`);
  }
}

/**
 * Create and save embedding for a conversation
 * @param {number} conversationId - The conversation ID
 * @param {string} title - The conversation title
 * @param {string} summary - The conversation summary (optional)
 * @returns {Promise<Object>} - The saved embedding record
 */
export async function createAndSaveConversationEmbedding(conversationId, title, summary = null) {
  try {
    let titleEmbedding = null;
    let summaryEmbedding = null;
    
    // Create title embedding
    if (title) {
      const titleResult = await createEmbedding(title);
      titleEmbedding = titleResult.embedding;
    }
    
    // Create summary embedding if provided
    if (summary) {
      const summaryResult = await createEmbedding(summary);
      summaryEmbedding = summaryResult.embedding;
    }
    
    // Save to database
    const result = await saveConversationEmbedding(conversationId, titleEmbedding, summaryEmbedding);
    
    return result;
  } catch (error) {
    console.error('Error creating and saving conversation embedding:', error);
    throw new Error(`Failed to create and save conversation embedding: ${error.message}`);
  }
}

/**
 * Find similar conversations based on title similarity
 * @param {string} queryTitle - The query title
 * @param {number} userId - The user ID to filter conversations
 * @param {number} threshold - Minimum similarity threshold (default: 0.7)
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<Array<Object>>} - Array of similar conversations with similarity scores
 */
export async function findSimilarConversations(queryTitle, userId, threshold = 0.7, limit = 10) {
  try {
    // Create embedding for the query title
    const { embedding: queryEmbedding } = await createEmbedding(queryTitle);
    
    // Get all conversation embeddings for the user
    const userConversations = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        titleEmbedding: conversationEmbeddings.titleEmbedding
      })
      .from(conversations)
      .leftJoin(conversationEmbeddings, eq(conversations.id, conversationEmbeddings.conversationId))
      .where(eq(conversations.userId, userId));
    
    // Calculate similarities
    const similarities = userConversations
      .filter(conv => conv.titleEmbedding) // Only include conversations with embeddings
      .map(conv => ({
        id: conv.id,
        title: conv.title,
        similarity: calculateCosineSimilarity(queryEmbedding, conv.titleEmbedding)
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarities;
  } catch (error) {
    console.error('Error finding similar conversations:', error);
    throw new Error(`Failed to find similar conversations: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Cosine similarity score between -1 and 1
 */
function calculateCosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embedding vectors must have the same dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}
