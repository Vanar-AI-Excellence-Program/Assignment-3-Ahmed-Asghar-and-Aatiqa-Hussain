import { db } from '../db.js';
import { documents, documentChunks, documentEmbeddings } from '../schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createEmbedding } from '../embedding.js';
import postgres from 'postgres';

export async function createDocument(documentData) {
  try {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

export async function getDocumentById(documentId) {
  try {
    const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
    return document;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

export async function getDocumentsByUserId(userId, limit = 50, offset = 0) {
  try {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
    return docs;
  } catch (error) {
    console.error('Error getting documents by user:', error);
    throw error;
  }
}

export async function getDocumentsByConversationId(conversationId, userId, limit = 50, offset = 0) {
  try {
    const docs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.conversationId, conversationId),
          eq(documents.userId, userId)
        )
      )
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
    return docs;
  } catch (error) {
    console.error('Error getting documents by conversation:', error);
    throw error;
  }
}

export async function getDocumentCountByConversationId(conversationId, userId) {
  try {
    const result = await db
      .select({ count: db.select().from(documents).count() })
      .from(documents)
      .where(
        and(
          eq(documents.conversationId, conversationId),
          eq(documents.userId, userId)
        )
      );
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting document count by conversation:', error);
    throw error;
  }
}

export async function updateDocumentStatus(documentId, status) {
  try {
    const [document] = await db
      .update(documents)
      .set({ status, updatedAt: new Date() })
      .where(eq(documents.id, documentId))
      .returning();
    return document;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}

export async function createDocumentChunk(chunkData) {
  try {
    const [chunk] = await db.insert(documentChunks).values(chunkData).returning();
    return chunk;
  } catch (error) {
    console.error('Error creating document chunk:', error);
    throw error;
  }
}

export async function getChunksByDocumentId(documentId) {
  try {
    const chunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, documentId))
      .orderBy(asc(documentChunks.chunkIndex));
    return chunks;
  } catch (error) {
    console.error('Error getting document chunks:', error);
    throw error;
  }
}

export async function createDocumentEmbedding(embeddingData) {
  try {
    const [embedding] = await db.insert(documentEmbeddings).values(embeddingData).returning();
    return embedding;
  } catch (error) {
    console.error('Error creating document embedding:', error);
    throw error;
  }
}

export async function findSimilarDocumentChunks(queryEmbedding, userId, conversationId, limit = 5, threshold = 0.7) {
  try {
    // Get chunks for the specific user and conversation for similarity calculation
    const chunks = await db
      .select({
        id: documentChunks.id,
        content: documentChunks.content,
        documentId: documentChunks.documentId,
        chunkIndex: documentChunks.chunkIndex,
        metadata: documentChunks.metadata,
        embedding: documentEmbeddings.embedding,
        dimension: documentEmbeddings.dimension
      })
      .from(documentChunks)
      .innerJoin(documentEmbeddings, eq(documentChunks.id, documentEmbeddings.chunkId))
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.conversationId, conversationId)
        )
      );

    console.log('🔍 Searching through', chunks.length, 'document chunks for user', userId, 'in conversation', conversationId);

    // If no chunks found for this conversation, return empty array
    if (chunks.length === 0) {
      console.log('⚠️ No document chunks found for conversation', conversationId);
      return [];
    }

    // Calculate similarity scores for all chunks
    const chunksWithSimilarity = chunks.map(chunk => {
      const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        ...chunk,
        similarity
      };
    });

    // Filter by threshold, sort by similarity, then limit
    const filteredResults = chunksWithSimilarity
      .filter(chunk => chunk.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log('✅ Found', filteredResults.length, 'relevant chunks above threshold', threshold);
    return filteredResults;
  } catch (error) {
    console.error('Error finding similar document chunks:', error);
    throw error;
  }
}

export async function deleteDocument(documentId) {
  try {
    // This will cascade delete chunks and embeddings due to foreign key constraints
    const [document] = await db
      .delete(documents)
      .where(eq(documents.id, documentId))
      .returning();
    return document;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Save a full document with its embedding (one row per document)
 * @param {Object} documentData - Document data including content and embedding
 * @returns {Promise<Object>} - The created/updated document
 */
export async function saveDocumentFull(documentData) {
  try {
    const { conversation_id, doc_id, content, embedding } = documentData;
    
    // Use UPSERT (INSERT ... ON CONFLICT UPDATE) based on doc_id
    const [document] = await db
      .insert(documents)
      .values({
        doc_id: doc_id,
        filename: documentData.filename || 'document',
        originalName: documentData.originalName || 'document',
        fileSize: documentData.fileSize || content.length,
        mimeType: documentData.mimeType || 'text/plain',
        content: content,
        embedding: embedding,
        status: 'completed',
        userId: documentData.userId,
        conversationId: conversation_id
      })
      .onConflictDoUpdate({
        target: documents.doc_id,
        set: {
          content: content,
          embedding: embedding,
          status: 'completed',
          updatedAt: new Date()
        }
      })
      .returning();
    
    console.log(`✅ Document saved/updated with doc_id: ${doc_id}`);
    return document;
  } catch (error) {
    console.error('Error saving document full:', error);
    throw error;
  }
}

/**
 * Get document by doc_id
 * @param {string} docId - Document UUID
 * @returns {Promise<Object|null>} - Document or null if not found
 */
export async function getDocumentByDocId(docId) {
  try {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.doc_id, docId));
    return document;
  } catch (error) {
    console.error('Error getting document by doc_id:', error);
    throw error;
  }
}

export async function getDocumentStats(userId) {
  try {
    const stats = await db
      .select({
        totalDocuments: db.select().from(documents).where(eq(documents.userId, userId)).count(),
        processingDocuments: db.select().from(documents).where(and(eq(documents.userId, userId), eq(documents.status, 'processing'))).count(),
        completedDocuments: db.select().from(documents).where(and(eq(documents.userId, userId), eq(documents.status, 'completed'))).count(),
        failedDocuments: db.select().from(documents).where(and(eq(documents.userId, userId), eq(documents.status, 'failed'))).count()
      });
    return stats[0];
  } catch (error) {
    console.error('Error getting document stats:', error);
    throw error;
  }
}

// Helper function to calculate cosine similarity
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

/**
 * Delete document by doc_id
 * @param {string} docId - Document UUID
 * @returns {Promise<Object>} - Deleted document
 */
export async function deleteDocumentByDocId(docId) {
  try {
    const [document] = await db
      .delete(documents)
      .where(eq(documents.doc_id, docId))
      .returning();
    return document;
  } catch (error) {
    console.error('Error deleting document by doc_id:', error);
    throw error;
  }
}

/**
 * Unified search function that works with both old chunked data and new full document data
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {number} conversationId - Conversation ID to filter by
 * @param {number} limit - Maximum number of results
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Promise<Array>} - Array of similar documents/chunks with similarity scores
 */
export async function findSimilarDocumentsUnified(queryEmbedding, conversationId, limit = 5, threshold = 0.7) {
  try {
    console.log(`🔍 Unified search for conversation ${conversationId}`);
    
    // First, try to find documents with direct embeddings (new format)
    const fullDocuments = await findSimilarDocuments(queryEmbedding, conversationId, limit, threshold);
    
    if (fullDocuments.length > 0) {
      console.log(`✅ Found ${fullDocuments.length} documents with direct embeddings`);
      return fullDocuments;
    }
    
    // If no direct embeddings found, search through chunks (old format)
    console.log('🔍 No direct embeddings found, searching through chunks...');
    const chunkedResults = await findSimilarDocumentChunks(queryEmbedding, null, conversationId, limit, threshold);
    
    if (chunkedResults.length > 0) {
      console.log(`✅ Found ${chunkedResults.length} chunks with embeddings`);
      return chunkedResults;
    }
    
    console.log('⚠️ No documents or chunks found for conversation', conversationId);
    return [];
    
  } catch (error) {
    console.error('Error in unified document search:', error);
    throw error;
  }
}

/**
 * Find similar documents using vector similarity search (new format)
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {number} conversationId - Conversation ID to filter by
 * @param {number} limit - Maximum number of results
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Promise<Array>} - Array of similar documents with similarity scores
 */
export async function findSimilarDocuments(queryEmbedding, conversationId, limit = 5, threshold = 0.7) {
  try {
    // Debug logging
    console.log('🔍 findSimilarDocuments called with:', {
      queryEmbedding: queryEmbedding ? `${queryEmbedding.length} elements` : 'null/undefined',
      conversationId,
      limit,
      threshold
    });

    // Validate parameters
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      console.error('❌ Invalid queryEmbedding:', queryEmbedding);
      throw new Error('Invalid query embedding provided');
    }

    if (!conversationId) {
      console.error('❌ Invalid conversationId:', conversationId);
      throw new Error('Invalid conversation ID provided');
    }

    const params = [queryEmbedding, conversationId, threshold, limit];
    console.log('🔍 SQL params:', params);

    // Use PostgreSQL vector similarity search with cosine distance
    // Use raw postgres client for vector operations since Drizzle ORM doesn't support pgvector
    const client = postgres(process.env.DATABASE_URL);
    
    try {
      const similarDocs = await client`
        SELECT 
          id,
          doc_id,
          filename,
          content,
          embedding,
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM documents 
        WHERE "conversationId" = ${conversationId}
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> ${queryEmbedding}::vector) >= ${threshold}
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;
      
      console.log(`✅ Found ${similarDocs.length} similar documents for conversation ${conversationId}`);
      return similarDocs;
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error finding similar documents:', error);
    // If vector extension is not available, fall back to manual calculation
    console.log('⚠️ Vector extension not available, falling back to manual calculation');
    return await findSimilarDocumentsManual(queryEmbedding, conversationId, limit, threshold);
  }
}

/**
 * Manual similarity search fallback when vector extension is not available
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {number} conversationId - Conversation ID to filter by
 * @param {number} limit - Maximum number of results
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Promise<Array>} - Array of similar documents with similarity scores
 */
export async function findSimilarDocumentsManual(queryEmbedding, conversationId, limit = 5, threshold = 0.7) {
  try {
    // Get all documents for the conversation with embeddings
    const docs = await db
      .select({
        id: documents.id,
        doc_id: documents.doc_id,
        filename: documents.filename,
        content: documents.content,
        embedding: documents.embedding
      })
      .from(documents)
      .where(
        and(
          eq(documents.conversationId, conversationId),
          eq(documents.status, 'completed')
        )
      );

    console.log(`🔍 Manually calculating similarity for ${docs.length} documents`);

    // Calculate similarity scores for all documents
    const docsWithSimilarity = docs
      .filter(doc => doc.embedding && doc.embedding.length > 0)
      .map(doc => {
        const similarity = calculateCosineSimilarity(queryEmbedding, doc.embedding);
        return {
          ...doc,
          similarity
        };
      })
      .filter(doc => doc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${docsWithSimilarity.length} similar documents above threshold ${threshold}`);
    return docsWithSimilarity;
  } catch (error) {
    console.error('Error in manual similarity search:', error);
    throw error;
  }
}
