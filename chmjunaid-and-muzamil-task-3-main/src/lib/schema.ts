import { pgTable, serial, varchar, timestamp, boolean, integer, text, primaryKey, jsonb, pgEnum, uuid, real, vector } from 'drizzle-orm/pg-core';

// Create enum for message roles
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const users = pgTable('user', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // For storing hashed password
  emailVerified: boolean('emailVerified').default(false), // Quoted identifier
  image: varchar('image', { length: 255 }),
  role: varchar('role', { length: 20 }).default('user'),
  verificationToken: varchar('verificationToken', { length: 255 }), // Quoted identifier
  verificationTokenExpiry: timestamp('verificationTokenExpiry', { mode: 'date' }), // Quoted identifier
  resetToken: varchar('resetToken', { length: 255 }), // Quoted identifier
  resetTokenExpiry: timestamp('resetTokenExpiry', { mode: 'date' }), // Quoted identifier
  otp: varchar('otp', { length: 6 }), // 6-digit OTP
  otpExpiry: timestamp('otpExpiry', { mode: 'date' }), // OTP expiry time
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(), // Quoted identifier
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(), // Quoted identifier
});

export const accounts = pgTable('account', {
  id: serial('id'),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] })
}));

export const sessions = pgTable('session', {
  id: serial('id').primaryKey(),
  sessionToken: varchar('sessionToken', { length: 1024 }).notNull().unique(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  data: jsonb('data'),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.identifier, table.token] })
}));

export const conversations = pgTable('conversation', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

export const messages = pgTable('message', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversationId').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(), // message body
  parentId: integer('parentId'), // nullable, points to previous message in conversation
  versionGroupId: uuid('versionGroupId').defaultRandom(), // groups versions of the same "slot" in conversation
  versionNumber: integer('versionNumber').default(1), // increments on each edit/regeneration
  isEdited: boolean('isEdited').default(false), // marks if this is an edited version
  isActive: boolean('isActive').default(true), // marks if this version is currently active in the conversation
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// User Sessions Table
export const userSessions = pgTable('userSession', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('sessionToken', { length: 1024 }).notNull(),
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: text('userAgent'),
  loginTime: timestamp('loginTime', { withTimezone: true }).defaultNow(),
  logoutTime: timestamp('logoutTime', { withTimezone: true }),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// User Activities Table
export const userActivities = pgTable('userActivity', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: varchar('activityType', { length: 50 }).notNull(), // 'login', 'logout', 'chat', 'profile_update', 'password_change', etc.
  description: text('description').notNull(),
  metadata: jsonb('metadata'), // Additional data like IP, user agent, etc.
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// User Stats Table
export const userStats = pgTable('userStat', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  totalChatMessages: integer('totalChatMessages').default(0),
  totalConversations: integer('totalConversations').default(0),
  lastActivityAt: timestamp('lastActivityAt', { withTimezone: true }),
  lastLoginAt: timestamp('lastLoginAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// Admin Actions Table (for tracking admin activities)
export const adminActions = pgTable('adminAction', {
  id: serial('id').primaryKey(),
  adminId: integer('adminId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actionType: varchar('actionType', { length: 50 }).notNull(), // 'user_delete', 'role_change', 'user_disable', etc.
  targetUserId: integer('targetUserId').references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ipAddress', { length: 45 }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// Message Embeddings Table
export const messageEmbeddings = pgTable('messageEmbedding', {
  id: serial('id').primaryKey(),
  messageId: integer('messageId').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 3072 }).notNull(), // Vector embedding
  dimension: integer('dimension').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// Conversation Embeddings Table (for semantic search)
export const conversationEmbeddings = pgTable('conversationEmbedding', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversationId').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  titleEmbedding: vector('titleEmbedding', { dimensions: 3072 }).notNull(), // Embedding of conversation title
  summaryEmbedding: vector('summaryEmbedding', { dimensions: 3072 }).notNull(), // Embedding of conversation summary
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// RAG System Tables
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  doc_id: uuid('doc_id').defaultRandom().unique(), // Unique identifier for document
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('originalName', { length: 255 }).notNull(),
  fileSize: integer('fileSize').notNull(),
  mimeType: varchar('mimeType', { length: 100 }).notNull(),
  content: text('content').notNull(), // Full document content
  embedding: real('embedding').array(768), // Full document embedding vector
  status: varchar('status', { length: 20 }).default('processing'), // processing, completed, failed
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: integer('conversationId').references(() => conversations.id, { onDelete: 'cascade' }), // Conversation-scoped documents
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

export const documentChunks = pgTable('documentChunks', {
  id: serial('id').primaryKey(),
  documentId: integer('documentId').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunkIndex').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // Store chunk metadata like page number, section, etc.
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

export const documentEmbeddings = pgTable('documentEmbeddings', {
  id: serial('id').primaryKey(),
  chunkId: integer('chunkId').notNull().references(() => documentChunks.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 3072 }).notNull(), // Vector embedding
  dimension: integer('dimension').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// TypeScript type definitions for the schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type UserActivity = typeof userActivities.$inferSelect;
export type NewUserActivity = typeof userActivities.$inferInsert;

export type UserStat = typeof userStats.$inferSelect;
export type NewUserStat = typeof userStats.$inferInsert;

export type AdminAction = typeof adminActions.$inferSelect;
export type NewAdminAction = typeof adminActions.$inferInsert;

export type MessageEmbedding = typeof messageEmbeddings.$inferSelect;
export type NewMessageEmbedding = typeof messageEmbeddings.$inferInsert;

export type ConversationEmbedding = typeof conversationEmbeddings.$inferSelect;
export type NewConversationEmbedding = typeof conversationEmbeddings.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type NewDocumentEmbedding = typeof documentEmbeddings.$inferInsert;
