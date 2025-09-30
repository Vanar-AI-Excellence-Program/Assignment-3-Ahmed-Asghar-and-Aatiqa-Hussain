import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types.js";

export const PUT: RequestHandler = async ({ request, locals, params }) => {
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

    const { role } = await request.json();
    const userId = params.userId;

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    if (!role || !["user", "admin"].includes(role)) {
      return json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === locals.user.id) {
      return json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // Update user role
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return json({
      message: `User role updated to ${role} successfully`,
    });
  } catch (error) {
    console.error("Change user role error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
