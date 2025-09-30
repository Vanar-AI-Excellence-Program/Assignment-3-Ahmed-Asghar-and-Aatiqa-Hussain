import { db } from "$lib/server/db";
import {
  ragDocuments,
  ragDocumentChunks,
  ragDocumentEmbeddings,
  type NewRagDocument,
  type NewRagDocumentChunk,
  type NewRagDocumentEmbedding,
} from "$lib/server/db/schema";
import { nanoid } from "nanoid";
import { EMBEDDING_API_URL } from "$lib/server/db";
import { eq, desc, asc, sql } from "drizzle-orm";

export interface DocumentUploadData {
  userId: string;
  conversationId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  content: string;
}

export interface ChunkData {
  content: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingData {
  embedding: number[];
  dimension: number;
}

export class DocumentStorageService {
  /**
   * Save a document to the database
   */
  async saveDocument(data: DocumentUploadData): Promise<string> {
    const documentId = nanoid();

    const newDocument: NewRagDocument = {
      id: documentId,
      userId: data.userId,
      conversationId: data.conversationId || null,
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      content: data.content,
      status: "processing",
    };

    await db.insert(ragDocuments).values(newDocument);
    console.log(`Document saved with ID: ${documentId}`);

    return documentId;
  }

  /**
   * Save document chunks to the database
   */
  async saveDocumentChunks(
    documentId: string,
    chunks: ChunkData[]
  ): Promise<string[]> {
    const chunkIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = nanoid();
      const chunk = chunks[i];

      const newChunk: NewRagDocumentChunk = {
        id: chunkId,
        documentId: documentId,
        chunkIndex: i,
        content: chunk.content,
        metadata: chunk.metadata || null,
      };

      await db.insert(ragDocumentChunks).values(newChunk);
      chunkIds.push(chunkId);
    }

    console.log(`Saved ${chunks.length} chunks for document ${documentId}`);
    return chunkIds;
  }

  /**
   * Generate embeddings for chunks and save them to the database
   */
  async generateAndSaveEmbeddings(
    chunkIds: string[],
    chunks: ChunkData[]
  ): Promise<void> {
    console.log(`Generating embeddings for ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = chunkIds[i];
      const chunk = chunks[i];

      try {
        // Generate embedding using the embedding service
        const embedding = await this.generateEmbedding(chunk.content);

        const newEmbedding: NewRagDocumentEmbedding = {
          id: nanoid(),
          chunkId: chunkId,
          embedding: embedding.embedding,
          dimension: embedding.dimension,
        };
        console.log(`Saving embedding for chunk $(newEmbedding.chunkId)`);
        await db.insert(ragDocumentEmbeddings).values(newEmbedding);
        console.log(`Saved embedding for chunk ${i + 1}/${chunks.length}`);

        // Small delay to prevent overwhelming the embedding service
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }
  }

  /**
   * Generate embedding for a text using the embedding service
   */
  private async generateEmbedding(text: string): Promise<EmbeddingData> {
    const response = await fetch(`${EMBEDDING_API_URL}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Embedding service error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      embedding: result.embedding,
      dimension: result.dim,
    };
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: "processing" | "completed" | "failed"
  ): Promise<void> {
    await db
      .update(ragDocuments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(ragDocuments.id, documentId));
  }

  /**
   * Get documents for a user
   */
  async getUserDocuments(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(ragDocuments)
      .where(eq(ragDocuments.userId, userId))
      .orderBy(desc(ragDocuments.createdAt));
  }

  /**
   * Get document chunks with embeddings for retrieval
   */
  async getDocumentChunksWithEmbeddings(documentId: string): Promise<any[]> {
    return await db
      .select({
        chunk: ragDocumentChunks,
        embedding: ragDocumentEmbeddings,
      })
      .from(ragDocumentChunks)
      .leftJoin(
        ragDocumentEmbeddings,
        eq(ragDocumentChunks.id, ragDocumentEmbeddings.chunkId)
      )
      .where(eq(ragDocumentChunks.documentId, documentId))
      .orderBy(asc(ragDocumentChunks.chunkIndex));
  }

  /**
   * Search for similar chunks using vector similarity
   */
  async searchSimilarChunks(
    queryEmbedding: number[],
    userId: string,
    limit: number = 5
  ): Promise<any[]> {
    // Use pgvector distance operator <#> (lower is closer). Convert to similarity score.
    const rows = await db.execute(
      sql`SELECT c.*, d.*, (1 - (e.embedding <#> ${queryEmbedding}::vector)) AS score
          FROM ${ragDocumentEmbeddings} e
          JOIN ${ragDocumentChunks} c ON c.id = e.chunk_id
          JOIN ${ragDocuments} d ON d.id = c.document_id
          WHERE d.user_id = ${userId}
          ORDER BY (e.embedding <#> ${queryEmbedding}::vector) ASC
          LIMIT ${limit}`
    );

    // Normalize shape to match previous callers: { chunk, document, score }
    const results = (rows as any[]).map((r) => ({
      chunk: {
        id: r.id,
        documentId: r.document_id,
        chunkIndex: r.chunk_index,
        content: r.content,
        metadata: r.metadata ?? null,
      },
      document: {
        id: r.id_1 ?? r.document_id, // alias differences across drivers
        userId: r.user_id,
        conversationId: r.conversation_id,
        filename: r.filename,
        originalName: r.original_name,
        mimeType: r.mime_type,
        fileSize: r.file_size,
        content: r.content_1 ?? r.content,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
      score: Number(r.score),
    }));

    return results;
  }

  /**
   * Get relevant documents for a query using RAG
   */
  async getRelevantDocuments(
    query: string,
    userId: string,
    limit: number = 3
  ): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search for similar chunks
      const similarChunks = await this.searchSimilarChunks(
        queryEmbedding.embedding,
        userId,
        limit
      );

      return similarChunks;
    } catch (error) {
      console.error("Error retrieving relevant documents:", error);
      return [];
    }
  }

  /**
   * Delete a document and all its chunks/embeddings
   */
  async deleteDocument(documentId: string): Promise<void> {
    // Delete embeddings first
    await db
      .delete(ragDocumentEmbeddings)
      .where(
        eq(
          ragDocumentEmbeddings.chunkId,
          db
            .select({ id: ragDocumentChunks.id })
            .from(ragDocumentChunks)
            .where(eq(ragDocumentChunks.documentId, documentId))
        )
      );

    // Delete chunks
    await db
      .delete(ragDocumentChunks)
      .where(eq(ragDocumentChunks.documentId, documentId));

    // Delete document
    await db.delete(ragDocuments).where(eq(ragDocuments.id, documentId));

    console.log(`Deleted document ${documentId} and all related data`);
  }
}

// Export singleton instance
export const documentStorageService = new DocumentStorageService();
