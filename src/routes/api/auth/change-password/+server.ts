import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { RequestHandler } from "./$types.js";

export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get current user with password
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, locals.user.id));

    if (!currentUser.length) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      currentUser[0].password || ""
    );

    if (!isCurrentPasswordValid) {
      return json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.user.id));

    return json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
