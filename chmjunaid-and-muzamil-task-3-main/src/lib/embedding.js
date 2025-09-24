import { env } from '$env/dynamic/private';

const EMBEDDING_SERVICE_URL = env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

/**
 * Create an embedding for the given text using the embedding service
 * @param {string} text - The text to embed
 * @returns {Promise<{embedding: number[], dim: number}>} - The embedding vector and dimension
 */
export async function createEmbedding(text) {
  try {
    const response = await fetch(`${EMBEDDING_SERVICE_URL}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      embedding: data.embedding,
      dim: data.dim
    };
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw new Error(`Failed to create embedding: ${error.message}`);
  }
}

/**
 * Create embeddings for multiple texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<Array<{embedding: number[], dim: number}>>} - Array of embedding results
 */
export async function createEmbeddings(texts) {
  const embeddings = [];
  
  for (const text of texts) {
    try {
      const embedding = await createEmbedding(text);
      embeddings.push(embedding);
    } catch (error) {
      console.error(`Error creating embedding for text: ${text.substring(0, 100)}...`, error);
      // Return null for failed embeddings
      embeddings.push(null);
    }
  }
  
  return embeddings;
}

/**
 * Check if the embedding service is healthy
 * @returns {Promise<boolean>} - True if service is healthy
 */
export async function checkEmbeddingServiceHealth() {
  try {
    const response = await fetch(`${EMBEDDING_SERVICE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Embedding service health check failed:', error);
    return false;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Cosine similarity score between -1 and 1
 */
export function calculateCosineSimilarity(embedding1, embedding2) {
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
 * Find similar messages based on embedding similarity
 * @param {number[]} queryEmbedding - The query embedding
 * @param {Array<{id: number, embedding: number[]}>} messageEmbeddings - Array of message embeddings to search
 * @param {number} threshold - Minimum similarity threshold (default: 0.7)
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Array<{id: number, similarity: number}>} - Sorted results with similarity scores
 */
export function findSimilarMessages(queryEmbedding, messageEmbeddings, threshold = 0.7, limit = 10) {
  const similarities = messageEmbeddings
    .map(({ id, embedding }) => ({
      id,
      similarity: calculateCosineSimilarity(queryEmbedding, embedding)
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
}
