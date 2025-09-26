import {
  pgTable,
  integer,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - Auth.js compatible
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: varchar("image", { length: 255 }),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Accounts table for Auth.js
export const accounts = pgTable("accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"), // Changed to text for longer tokens
  access_token: text("access_token"), // Changed to text for longer tokens
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: text("scope"), // Changed to text for longer scope strings
  id_token: text("id_token"), // Changed to text for longer JWT tokens
  session_state: varchar("session_state", { length: 255 }),
});

// Sessions table for Auth.js
export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
});

// Verification tokens table for email verification and password reset
export const verificationTokens = pgTable("verification_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'email_verification' or 'password_reset'
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  isAutoRenamed: boolean("is_auto_renamed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages table with tree structure support
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  parentId: varchar("parent_id", { length: 255 }), // nullable, points to previous message in conversation
  versionGroupId: varchar("version_group_id", { length: 255 }), // groups versions of the same "slot" in conversation
  versionNumber: integer("version_number").default(1), // increments on each edit/regeneration
  isEdited: boolean("is_edited").default(false), // marks if this is an edited version
  isActive: boolean("is_active").default(true), // marks if this version is currently active in the conversation
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  verificationTokens: many(verificationTokens),
  chatConversations: many(chatConversations),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.userId],
      references: [users.id],
    }),
  })
);

export const chatConversationsRelations = relations(
  chatConversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [chatConversations.userId],
      references: [users.id],
    }),
    messages: many(chatMessages),
  })
);

export const chatMessagesRelations = relations(
  chatMessages,
  ({ one, many }) => ({
    conversation: one(chatConversations, {
      fields: [chatMessages.conversationId],
      references: [chatConversations.id],
    }),
    parent: one(chatMessages, {
      fields: [chatMessages.parentId],
      references: [chatMessages.id],
      relationName: "messageParent",
    }),
    children: many(chatMessages, {
      relationName: "messageParent",
    }),
  })
);
