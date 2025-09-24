import { db } from './db.js';
import { sql } from 'drizzle-orm';

/**
 * Database migration script to update the users table schema
 * Run this after updating the schema.js file
 */
export async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Add new columns if they don't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS verificationToken VARCHAR(255),
      ADD COLUMN IF NOT EXISTS verificationTokenExpiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS resetToken VARCHAR(255),
      ADD COLUMN IF NOT EXISTS resetTokenExpiry TIMESTAMP
    `);
    
    // Update emailVerified column type if it exists as timestamp
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'emailVerified' 
          AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE users ALTER COLUMN "emailVerified" TYPE BOOLEAN USING FALSE;
        END IF;
      END $$;
    `);
    
    // Add emailVerified column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE
    `);
    
    // Drop old passwordHash column if it exists
    await db.execute(sql`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS password_hash
    `);
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

export async function migrateToConversationScopedRAG() {
  try {
    console.log('🚀 Starting migration to conversation-scoped RAG...');
    
    // Step 1: Add conversation_id column to documents table
    console.log('📝 Adding conversation_id column to documents table...');
    await db.execute(sql`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS "conversationId" INTEGER REFERENCES conversation(id) ON DELETE CASCADE;
    `);
    
    // Step 2: Create index for better performance
    console.log('🔍 Creating index on documents(conversationId)...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_documents_conversation_id 
      ON documents("conversationId");
    `);
    
    // Step 3: Create index for document chunks with conversation context
    console.log('🔍 Creating index on documentChunks with conversation context...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_conversation 
      ON "documentChunks"("documentId") 
      INCLUDE ("chunkIndex", "content");
    `);
    
    // Step 4: Create simple index for document embeddings (without including large embedding column)
    console.log('🔍 Creating index on documentEmbeddings...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_document_embeddings_chunk_id 
      ON "documentEmbeddings"("chunkId");
    `);
    
    console.log('✅ Migration to conversation-scoped RAG completed successfully!');
    console.log('📋 Changes made:');
    console.log('- Added conversationId column to documents table');
    console.log('- Created indexes for better query performance');
    console.log('- Documents are now scoped to specific conversations');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

if (process.argv[1] && process.argv[1].includes('db-migration.js')) {
  console.log('🔧 Running migration...');
  migrateToConversationScopedRAG()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
