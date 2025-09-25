-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table: high-level document metadata
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT,
  source TEXT,                 -- e.g., upload path or URL
  content TEXT,                -- optional original content (raw)
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chunks table: chunked text for each document
CREATE TABLE IF NOT EXISTS document_chunks (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Embeddings table: vector embeddings per chunk
-- Using dimension 768 by default (Gemini 1.5 text-embedding-004 is 768)
-- Adjust if you change the embedding model
CREATE TABLE IF NOT EXISTS chunk_embeddings (
  id VARCHAR(255) PRIMARY KEY,
  chunk_id VARCHAR(255) NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_chunk_id ON chunk_embeddings(chunk_id);
-- For similarity search using ivfflat (requires populated tables); fall back to flat if needed
-- You can later create an IVFFLAT index with a specific lists parameter for performance:
-- CREATE INDEX idx_chunk_embeddings_embedding_ivfflat ON chunk_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
-- For small datasets, a flat index is fine:
-- CREATE INDEX idx_chunk_embeddings_embedding_hnsw ON chunk_embeddings USING hnsw (embedding vector_l2_ops);


