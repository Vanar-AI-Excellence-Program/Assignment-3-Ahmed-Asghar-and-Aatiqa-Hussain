import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { accounts } from "../src/lib/server/db/schema.js";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema: { accounts } });

async function cleanupDuplicateAccounts() {
  console.log("🧹 Starting cleanup of duplicate accounts...");

  try {
    // Find and delete duplicate accounts based on provider + provider_account_id
    const result = await db.execute(sql`
      DELETE FROM accounts 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM accounts 
        GROUP BY provider, provider_account_id
      )
    `);

    console.log(`✅ Cleaned up ${result.rowCount || 0} duplicate accounts`);

    // Show remaining accounts
    const remainingAccounts = await db.select().from(accounts);
    console.log(`📊 Remaining accounts: ${remainingAccounts.length}`);

    remainingAccounts.forEach((account) => {
      console.log(
        `  - ${account.provider}: ${account.providerAccountId} (User: ${account.userId})`
      );
    });
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
  } finally {
    await client.end();
  }
}

cleanupDuplicateAccounts()
  .then(() => {
    console.log("🎉 Cleanup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Cleanup failed:", error);
    process.exit(1);
  });
