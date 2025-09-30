import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types.js";

export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, image } = await request.json();

    // Validation
    if (!name || !email) {
      return json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser.length > 0 && existingUser[0].id !== locals.user.id) {
      return json(
        { error: "Email is already taken by another user" },
        { status: 409 }
      );
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set({
        name,
        email,
        image: image || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.user.id))
      .returning();

    // Return updated user (without password)
    const { hashedPassword: _, ...userWithoutPassword } = updatedUser[0];

    return json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
