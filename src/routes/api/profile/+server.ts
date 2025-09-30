import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, locals.user.id));

    if (!userProfile.length) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Return user profile (without password)
    const { hashedPassword: _, ...userWithoutPassword } = userProfile[0];

    return json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
