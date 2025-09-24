import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
} else {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
}

// Create postgres client for Auth.js compatibility
const client = postgres(process.env.DATABASE_URL, {
  max: 20, // Maximum number of clients in the pool
  idle_timeout: 30, // Close idle clients after 30 seconds
  connect_timeout: 2, // Return an error after 2 seconds if connection could not be established
});

export const db = drizzle(client);

// Example: import and export your schema here
// export * from './schema';
