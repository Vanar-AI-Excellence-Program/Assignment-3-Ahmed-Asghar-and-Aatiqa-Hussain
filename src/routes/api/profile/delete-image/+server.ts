import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const DELETE: RequestHandler = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.auth?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user data
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, locals.auth.user.id),
    });

    if (!currentUser) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // If user has a profile image, delete the file
    if (
      currentUser.image &&
      currentUser.image.startsWith("/uploads/profiles/")
    ) {
      const imagePath = join(process.cwd(), "static", currentUser.image);

      // Check if file exists and delete it
      if (existsSync(imagePath)) {
        try {
          await unlink(imagePath);
        } catch (error) {
          console.error("Error deleting image file:", error);
          // Continue with database update even if file deletion fails
        }
      }
    }

    // Update user's image to null in database
    await db
      .update(users)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.auth.user.id));

    return json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    console.error("Image delete error:", error);
    return json({ error: "Failed to delete image" }, { status: 500 });
  }
};
