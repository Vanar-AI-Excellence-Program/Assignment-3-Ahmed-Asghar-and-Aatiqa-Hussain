import { db } from "../src/lib/server/db.js";
import { users } from "../src/lib/server/db/schema.js";
import { eq } from "drizzle-orm";

async function promoteToAdmin(email: string) {
  try {
    console.log(`Promoting user with email: ${email} to admin...`);

    const result = await db
      .update(users)
      .set({
        role: "admin",
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning();

    if (result.length > 0) {
      console.log(`✅ Successfully promoted ${email} to admin role!`);
      console.log("User details:", result[0]);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
  } catch (error) {
    console.error("Error promoting user to admin:", error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log("Usage: npm run promote-admin <email>");
  console.log("Example: npm run promote-admin user@example.com");
  process.exit(1);
}

promoteToAdmin(email)
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
