console.log('🔧 Database reset script starting...');
console.log('📊 Environment check...');

import { db } from './db.js';
import { sql } from 'drizzle-orm';

console.log('✅ Imports successful');

/**
 * Database reset script to completely recreate the database with new schema
 * This will drop all existing tables and create new ones with the updated schema
 */
export async function resetDatabase() {
  try {
    console.log('🚀 Starting database reset...');
    console.log('📊 Checking database connection...');
    
    // Test connection first
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    
    console.log('🗑️ Dropping existing tables...');
    
    // Drop all existing tables in the correct order (respecting foreign key constraints)
    await db.execute(sql`
      DROP TABLE IF EXISTS adminAction CASCADE;
      DROP TABLE IF EXISTS userStat CASCADE;
      DROP TABLE IF EXISTS userActivity CASCADE;
      DROP TABLE IF EXISTS userSession CASCADE;
      DROP TABLE IF EXISTS message CASCADE;
      DROP TABLE IF EXISTS conversation CASCADE;
      DROP TABLE IF EXISTS verificationToken CASCADE;
      DROP TABLE IF EXISTS session CASCADE;
      DROP TABLE IF EXISTS account CASCADE;
      DROP TABLE IF EXISTS "user" CASCADE;
    `);
    
    console.log('✅ All existing tables dropped successfully!');
    
    // Drop the enum if it exists
    console.log('🗑️ Dropping existing enum...');
    await db.execute(sql`
      DROP TYPE IF EXISTS message_role CASCADE;
    `);
    
    console.log('✅ Enum dropped successfully!');
    
    // Create the enum for message roles
    console.log('🔧 Creating message_role enum...');
    await db.execute(sql`
      CREATE TYPE message_role AS ENUM ('user', 'assistant');
    `);
    console.log('✅ message_role enum created');
    
    // Create users table
    console.log('🔧 Creating users table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        "emailVerified" BOOLEAN DEFAULT FALSE,
        image VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        "verificationToken" VARCHAR(255),
        "verificationTokenExpiry" TIMESTAMP,
        "resetToken" VARCHAR(255),
        "resetTokenExpiry" TIMESTAMP,
        otp VARCHAR(6),
        "otpExpiry" TIMESTAMP,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created');
    
    // Create conversations table
    console.log('🔧 Creating conversations table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversation (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Conversations table created');
    
    // Create messages table
    console.log('🔧 Creating messages table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message (
        id SERIAL PRIMARY KEY,
        "conversationId" INTEGER NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
        role message_role NOT NULL,
        content TEXT NOT NULL,
        "parentId" INTEGER,
        "versionGroupId" UUID DEFAULT gen_random_uuid(),
        "versionNumber" INTEGER DEFAULT 1,
        "isEdited" BOOLEAN DEFAULT FALSE,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Messages table created');
    
    // Create account table
    console.log('🔧 Creating account table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS account (
        id SERIAL,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        "providerAccountId" VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        PRIMARY KEY (provider, "providerAccountId")
      );
    `);
    console.log('✅ Account table created');
    
    // Create session table
    console.log('🔧 Creating session table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        id SERIAL PRIMARY KEY,
        "sessionToken" VARCHAR(1024) NOT NULL UNIQUE,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL,
        data JSONB
      );
    `);
    console.log('✅ Session table created');
    
    // Create verificationToken table
    console.log('🔧 Creating verificationToken table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verificationToken" (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `);
    console.log('✅ VerificationToken table created');
    
    // Create userSession table
    console.log('🔧 Creating userSession table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "userSession" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "sessionToken" VARCHAR(1024) NOT NULL,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "loginTime" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "logoutTime" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ UserSession table created');
    
    // Create userActivity table
    console.log('🔧 Creating userActivity table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "userActivity" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "activityType" VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ UserActivity table created');
    
    // Create userStat table
    console.log('🔧 Creating userStat table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "userStat" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE UNIQUE,
        "totalChatMessages" INTEGER DEFAULT 0,
        "totalConversations" INTEGER DEFAULT 0,
        "lastActivityAt" TIMESTAMP WITH TIME ZONE,
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ UserStat table created');
    
    // Create adminAction table
    console.log('🔧 Creating adminAction table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "adminAction" (
        id SERIAL PRIMARY KEY,
        "adminId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "actionType" VARCHAR(50) NOT NULL,
        "targetUserId" INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        metadata JSONB,
        "ipAddress" VARCHAR(45),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ AdminAction table created');
    
    // Create indexes for better performance
    console.log('🔧 Creating database indexes...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_message_conversation_id ON message("conversationId");
      CREATE INDEX IF NOT EXISTS idx_message_parent_id ON message("parentId");
      CREATE INDEX IF NOT EXISTS idx_message_role ON message(role);
      CREATE INDEX IF NOT EXISTS idx_message_version_group_id ON message("versionGroupId");
      CREATE INDEX IF NOT EXISTS idx_message_is_active ON message("isActive");
      CREATE INDEX IF NOT EXISTS idx_conversation_user_id ON conversation("userId");
      CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
    `);
    console.log('✅ Database indexes created');
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('📋 New schema created with support for:');
    console.log('- Message editing and regeneration');
    console.log('- Version grouping and active state tracking');
    console.log('- Parent-child message relationships');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

console.log('🔧 Script loaded, checking if running directly...');
console.log('📁 Script path:', process.argv[1]);

// Run reset if this file is executed directly
if (process.argv[1] && process.argv[1].includes('db-reset.js')) {
  console.log('🚀 Running database reset...');
  resetDatabase()
    .then(() => {
      console.log('\n✅ Database reset completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Reset failed:', error);
      process.exit(1);
    });
} else {
  console.log('📦 Script imported as module');
}
