import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users, sessions, accounts, verificationTokens } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types.js";

export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    // Check if user is authenticated and is admin
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    if (locals.user.role !== "admin") {
      return json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const userId = params.userId;

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === locals.user.id) {
      return json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Delete user and all related data in a transaction
    await db.transaction(async (tx) => {
      // Delete verification tokens
      await tx.delete(verificationTokens).where(eq(verificationTokens.userId, userId));
      
      // Delete OAuth accounts
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      
      // Delete sessions
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      
      // Finally delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });

    return json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
