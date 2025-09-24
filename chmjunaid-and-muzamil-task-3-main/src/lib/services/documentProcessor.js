import { createEmbedding } from '../embedding.js';
import { createDocument, createDocumentChunk, createDocumentEmbedding, updateDocumentStatus, findSimilarDocumentChunks, saveDocumentFull, findSimilarDocuments, findSimilarDocumentsUnified } from '../repositories/documentRepository.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Import fetch and FormData for Node.js if not available globally
const fetch = globalThis.fetch || (await import('node-fetch')).default;
const FormData = globalThis.FormData || (await import('form-data')).default;

// Text chunking configuration
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // characters overlap between chunks

// Dynamic imports for optional dependencies
let pdfParse = null;
let mammoth = null;

// Python embedding service URL (adjust port if needed)
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

const callPythonEmbeddingService = async (file) => {
  try {
    const formData = new FormData();
    
    // Handle different file input types and create proper Blob/File for FormData
    let fileToUpload;
    
    if (file.buffer instanceof Buffer) {
      // Server-side: Convert Buffer to Blob
      const blob = new Blob([file.buffer], { 
        type: file.type || 'application/pdf' 
      });
      fileToUpload = new File([blob], file.name || 'document.pdf', {
        type: file.type || 'application/pdf'
      });
    } else if (file.arrayBuffer) {
      // Browser File API: Convert to Buffer then to Blob
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { 
        type: file.type || 'application/pdf' 
      });
      fileToUpload = new File([blob], file.name || 'document.pdf', {
        type: file.type || 'application/pdf'
      });
    } else if (file instanceof File) {
      // Already a File object, use directly
      fileToUpload = file;
    } else {
      throw new Error('Unsupported file format for PDF processing');
    }
    
    // Append the proper File object to FormData
    formData.append('file', fileToUpload);
    
    const response = await fetch(`${EMBEDDING_SERVICE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`Python service error: ${errorData.detail || response.statusText}`);
    }
    
    const result = await response.json();
    
    // Extract text from all chunks
    const fullText = result.embeddings.map(chunk => chunk.text).join('\n\n');
    
    return {
      text: fullText,
      chunks: result.embeddings,
      totalTokens: result.total_tokens
    };
    
  } catch (error) {
    console.error('Error calling Python embedding service:', error);
    throw new Error(`Failed to process PDF with Python service: ${error.message}`);
  }
};

const loadPdfParse = async () => {
  if (!pdfParse) {
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch (error) {
      console.warn('pdf-parse not available:', error.message);
      throw new Error('PDF processing requires pdf-parse package. Install with: npm install pdf-parse');
    }
  }
  return pdfParse;
};

const loadMammoth = async () => {
  if (!mammoth) {
    try {
      mammoth = (await import('mammoth')).default;
    } catch (error) {
      console.warn('mammoth not available:', error.message);
      throw new Error('DOCX processing requires mammoth package. Install with: npm install mammoth');
    }
  }
  return mammoth;
};

export class DocumentProcessor {
  constructor() {
    this.supportedTypes = {
      'text/plain': this.processTextFile,
      'text/markdown': this.processTextFile,
      'application/pdf': this.processPdfFile,
      'application/msword': this.processDocFile,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.processDocxFile
    };
  }

  async processDocument(file, userId, conversationId = null) {
    let document = null;
    try {
      // Handle different file input types
      let fileName, fileSize, mimeType, fileBuffer;

      if (file.buffer && file.name && file.size && file.type) {
        // File with metadata object (from server upload)
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
        fileBuffer = file.buffer;
      } else if (file instanceof Buffer) {
        // Buffer input (from server upload)
        fileName = 'uploaded-file';
        fileSize = file.length;
        mimeType = 'application/octet-stream';
        fileBuffer = file;
      } else if (file.name && file.size && file.type) {
        // File object (from browser)
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
        fileBuffer = file;
      } else {
        throw new Error('Unsupported file format');
      }

      console.log(`Processing document: ${fileName} (${mimeType}) for conversation: ${conversationId || 'global'}`);

      // Create document record
      const documentData = {
        filename: fileName,
        originalName: fileName,
        fileSize: fileSize,
        mimeType: mimeType,
        content: '', // Will be populated after processing
        status: 'processing',
        userId: userId,
        conversationId: conversationId // Associate document with conversation
      };

      document = await createDocument(documentData);

      // Extract text content based on file type
      const processor = this.supportedTypes[mimeType];
      if (!processor) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const content = await processor.call(this, fileBuffer);

      // Update document with content
      await updateDocumentStatus(document.id, 'processing');

      // Chunk the content
      const chunks = this.chunkText(content);

      // Process chunks and create embeddings
      await this.processChunks(document.id, chunks);

      // Mark document as completed
      await updateDocumentStatus(document.id, 'completed');

      console.log(`Document processing completed: ${document.id}`);
      return document;

    } catch (error) {
      console.error('Error processing document:', error);

      // Mark document as failed
      if (document?.id) {
        await updateDocumentStatus(document.id, 'failed');
      }

      throw error;
    }
  }

  async processTextFile(fileBuffer) {
    try {
      // Convert buffer to string
      let content = '';

      if (fileBuffer instanceof Buffer) {
        content = fileBuffer.toString('utf-8');
      } else if (fileBuffer.arrayBuffer) {
        // Handle web File API
        const arrayBuffer = await fileBuffer.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        content = buffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file format for text processing');
      }

      return content;
    } catch (error) {
      console.error('Error processing text file:', error);
      throw new Error(`Failed to process text file: ${error.message}`);
    }
  }

  async processPdfFile(fileBuffer) {
    try {
      const pdfParse = await loadPdfParse();

      let buffer;
      if (fileBuffer instanceof Buffer) {
        buffer = fileBuffer;
      } else if (fileBuffer.arrayBuffer) {
        buffer = Buffer.from(await fileBuffer.arrayBuffer());
      } else {
        throw new Error('Unsupported file format for PDF processing');
      }

      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error processing PDF file:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  async processDocFile(file) {
    // DOC files are legacy, suggest conversion to DOCX
    throw new Error('DOC files are not supported. Please convert to DOCX format.');
  }

  async processDocxFile(fileBuffer) {
    try {
      const mammothLib = await loadMammoth();

      let buffer;
      if (fileBuffer instanceof Buffer) {
        buffer = fileBuffer;
      } else if (fileBuffer.arrayBuffer) {
        buffer = Buffer.from(await fileBuffer.arrayBuffer());
      } else {
        throw new Error('Unsupported file format for DOCX processing');
      }

      const result = await mammothLib.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error processing DOCX file:', error);
      throw new Error(`Failed to process DOCX: ${error.message}`);
    }
  }

  chunkText(text) {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
      
      // Try to break at a sentence boundary
      let actualEndIndex = endIndex;
      if (endIndex < text.length) {
        const nextPeriod = text.indexOf('.', endIndex - 100);
        const nextNewline = text.indexOf('\n', endIndex - 100);
        
        if (nextPeriod > endIndex - 100 && nextPeriod < endIndex + 100) {
          actualEndIndex = nextPeriod + 1;
        } else if (nextNewline > endIndex - 100 && nextNewline < endIndex + 100) {
          actualEndIndex = nextNewline + 1;
        }
      }

      const chunk = text.slice(startIndex, actualEndIndex).trim();
      
      if (chunk.length > 0) {
        chunks.push({
          content: chunk,
          startIndex,
          endIndex: actualEndIndex
        });
      }

      // Move start index with overlap
      startIndex = Math.max(startIndex + 1, actualEndIndex - CHUNK_OVERLAP);
    }

    return chunks;
  }

  async processChunks(documentId, chunks) {
    console.log(`Processing ${chunks.length} chunks for document ${documentId}`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Create chunk record
        const chunkData = {
          documentId: documentId,
          chunkIndex: i,
          content: chunk.content,
          metadata: {
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            chunkSize: chunk.content.length
          }
        };

        const createdChunk = await createDocumentChunk(chunkData);

        // Create embedding for the chunk
        console.log(`🔮 Creating embedding for chunk ${i + 1}/${chunks.length}, length: ${chunk.content.length}`);
        const embeddingResult = await createEmbedding(chunk.content);

        const embeddingData = {
          chunkId: createdChunk.id,
          embedding: embeddingResult.embedding,
          dimension: embeddingResult.dim
        };

        await createDocumentEmbedding(embeddingData);

        console.log(`✅ Processed chunk ${i + 1}/${chunks.length} for document ${documentId}, embedding dimension: ${embeddingResult.dim}`);

      } catch (error) {
        console.error(`Error processing chunk ${i} for document ${documentId}:`, error);
        // Continue with other chunks even if one fails
      }
    }
  }

  async searchDocuments(query, userId, conversationId, limit = 5, threshold = 0.7) {
    try {
      console.log('🔍 Starting document search for user', userId, 'in conversation', conversationId, 'with query:', query);

      // Create embedding for the query
      const queryEmbedding = await createEmbedding(query);
      console.log('📊 Query embedding created, dimension:', queryEmbedding.embedding.length);

      // Find similar documents/chunks using unified search
      const similarResults = await findSimilarDocumentsUnified(
        queryEmbedding.embedding,
        conversationId,
        limit,
        threshold
      );

      console.log('✅ Found', similarResults.length, 'similar results for conversation', conversationId);
      return similarResults;
    } catch (error) {
      console.error('❌ Error searching documents:', error);
      throw error;
    }
  }
}

export const documentProcessor = new DocumentProcessor();

// ===== NEW SIMPLIFIED RAG PROCESSOR =====

/**
 * Simplified document processor for full document storage
 * Processes documents as complete content without chunking
 */
export class FullDocumentProcessor {
  constructor() {
    this.supportedTypes = {
      'text/plain': this.processTextFile,
      'text/markdown': this.processTextFile,
      'application/pdf': this.processPdfFile,
      'application/msword': this.processDocFile,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.processDocxFile
    };
  }

  /**
   * Process a document and save it as a single row with full content and embedding
   * @param {Object} file - File object with buffer, name, size, type
   * @param {number} userId - User ID
   * @param {number} conversationId - Conversation ID
   * @returns {Promise<Object>} - The saved document
   */
  async processDocumentFull(file, userId, conversationId) {
    try {
      console.log(`📄 Processing full document: ${file.name} for conversation: ${conversationId}`);

      // Extract text content from file
      const content = await this.extractContent(file);
      console.log(`📝 Extracted content length: ${content.length} characters`);

      // Generate single embedding for the full document
      console.log(`🔮 Generating embedding for full document...`);
      const embeddingResult = await createEmbedding(content);
      console.log(`✅ Generated embedding with dimension: ${embeddingResult.dim}`);

      // Generate unique doc_id
      const doc_id = crypto.randomUUID();

      // Save document with full content and embedding
      const documentData = {
        doc_id: doc_id,
        conversation_id: conversationId,
        content: content,
        embedding: embeddingResult.embedding,
        filename: file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userId: userId
      };

      const savedDocument = await saveDocumentFull(documentData);
      console.log(`✅ Document saved successfully with doc_id: ${doc_id}`);

      return savedDocument;

    } catch (error) {
      console.error('❌ Error processing full document:', error);
      throw error;
    }
  }

  /**
   * Extract text content from file based on type
   * @param {Object} file - File object
   * @returns {Promise<string>} - Extracted text content
   */
  async extractContent(file) {
    const processor = this.supportedTypes[file.type];
    if (!processor) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    return await processor.call(this, file);
  }

  /**
   * Search for similar documents using vector similarity
   * @param {string} query - Search query
   * @param {number} conversationId - Conversation ID to search within
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Minimum similarity threshold
   * @returns {Promise<Array>} - Similar documents
   */
  async searchDocuments(query, conversationId, limit = 5, threshold = 0.7) {
    try {
      console.log(`🔍 Searching documents for query: "${query}" in conversation ${conversationId}`);

      // Generate embedding for the query
      const queryEmbedding = await createEmbedding(query);
      console.log(`📊 Query embedding generated with dimension: ${queryEmbedding.dim}`);
      console.log(`📊 Query embedding data:`, {
        hasEmbedding: !!queryEmbedding.embedding,
        embeddingLength: queryEmbedding.embedding ? queryEmbedding.embedding.length : 'N/A',
        dim: queryEmbedding.dim
      });

      // Find similar documents using unified search (works with both old and new data)
      const similarDocs = await findSimilarDocumentsUnified(
        queryEmbedding.embedding,
        conversationId,
        limit,
        threshold
      );

      console.log(`✅ Found ${similarDocs.length} similar documents/chunks`);
      return similarDocs;

    } catch (error) {
      console.error('❌ Error searching documents:', error);
      throw error;
    }
  }

  // Reuse existing file processing methods
  async processTextFile(file) {
    try {
      let content = '';
      if (file.buffer instanceof Buffer) {
        content = file.buffer.toString('utf-8');
      } else if (file.arrayBuffer) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        content = buffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file format for text processing');
      }
      return content;
    } catch (error) {
      console.error('Error processing text file:', error);
      throw new Error(`Failed to process text file: ${error.message}`);
    }
  }

  async processPdfFile(file) {
    try {
      console.log('📄 Using Python embedding service for PDF processing...');
      const result = await callPythonEmbeddingService(file);
      console.log(`✅ PDF processed successfully: ${result.chunks.length} chunks, ${result.totalTokens} tokens`);
      return result.text;
    } catch (error) {
      console.error('❌ Error processing PDF file with Python service:', error);
      // Fallback to old method if Python service is not available
      console.log('⚠️  Falling back to pdf-parse...');
      try {
        const pdfParse = await loadPdfParse();
        let buffer;
        if (file.buffer instanceof Buffer) {
          buffer = file.buffer;
        } else if (file.arrayBuffer) {
          buffer = Buffer.from(await file.arrayBuffer());
        } else {
          throw new Error('Unsupported file format for PDF processing');
        }
        const data = await pdfParse(buffer);
        return data.text;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw new Error(`Failed to process PDF: ${error.message}`);
      }
    }
  }

  async processDocFile(file) {
    throw new Error('DOC files are not supported. Please convert to DOCX format.');
  }

  async processDocxFile(file) {
    try {
      const mammothLib = await loadMammoth();
      let buffer;
      if (file.buffer instanceof Buffer) {
        buffer = file.buffer;
      } else if (file.arrayBuffer) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else {
        throw new Error('Unsupported file format for DOCX processing');
      }
      const result = await mammothLib.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error processing DOCX file:', error);
      throw new Error(`Failed to process DOCX: ${error.message}`);
    }
  }
}

export const fullDocumentProcessor = new FullDocumentProcessor();
