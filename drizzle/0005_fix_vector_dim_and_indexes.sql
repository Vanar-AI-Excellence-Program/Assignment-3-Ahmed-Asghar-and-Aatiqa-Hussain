-- Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Change embedding dimension to match MiniLM (384)
-- NOTE: Run this when data can be re-ingested or is already 384-dim
ALTER TABLE chunk_embeddings
  ALTER COLUMN embedding TYPE vector(384);

-- Ensure one embedding per chunk
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_chunk_embeddings_chunk_id'
  ) THEN
    ALTER TABLE chunk_embeddings
      ADD CONSTRAINT uniq_chunk_embeddings_chunk_id UNIQUE (chunk_id);
  END IF;
END$$;

-- Create IVFFLAT index for faster similarity search (requires ANALYZE on table and enough data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_chunk_embeddings_embedding_ivfflat'
  ) THEN
    CREATE INDEX idx_chunk_embeddings_embedding_ivfflat
      ON chunk_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
  END IF;
END$$;

-- Helpful secondary indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(chunk_index);


