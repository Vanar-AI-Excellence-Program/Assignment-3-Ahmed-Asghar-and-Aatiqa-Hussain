import { db } from '../src/lib/server/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyRAGMigrations() {
  try {
    console.log('Applying RAG migrations...');
    
    // Apply 0004_rag_pgvector.sql
    const ragSQL = readFileSync(join(process.cwd(), 'drizzle', '0004_rag_pgvector.sql'), 'utf-8');
    await db.execute(sql.raw(ragSQL));
    console.log('✓ Applied 0004_rag_pgvector.sql');
    
    // Apply 0005_fix_vector_dim_and_indexes.sql
    const vectorFixSQL = readFileSync(join(process.cwd(), 'drizzle', '0005_fix_vector_dim_and_indexes.sql'), 'utf-8');
    await db.execute(sql.raw(vectorFixSQL));
    console.log('✓ Applied 0005_fix_vector_dim_and_indexes.sql');
    
    // Apply 0006_fix_user_id_types.sql
    const userTypeFixSQL = readFileSync(join(process.cwd(), 'drizzle', '0006_fix_user_id_types.sql'), 'utf-8');
    await db.execute(sql.raw(userTypeFixSQL));
    console.log('✓ Applied 0006_fix_user_id_types.sql');
    
    console.log('All RAG migrations applied successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

applyRAGMigrations();
