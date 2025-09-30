import {
  pgTable,
  integer,
  text,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
// pgvector support
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { vector } from "drizzle-orm/pg-core";

// Only RAG-related tables for migrations/push to avoid touching auth tables

export const ragDocuments = pgTable("rag_documents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  conversationId: varchar("conversation_id", { length: 255 }),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 150 }).notNull(),
  fileSize: integer("file_size").notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("processing"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ragDocumentChunks = pgTable("rag_document_chunks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  documentId: varchar("document_id", { length: 255 }).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ragDocumentEmbeddings = pgTable("rag_document_embeddings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chunkId: varchar("chunk_id", { length: 255 }).notNull(),
  embedding: vector("embedding", { dimensions: 3072 }).notNull(),
  dimension: integer("dimension").notNull().default(3072),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
