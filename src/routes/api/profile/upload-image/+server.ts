import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.auth?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "static", "uploads", "profiles");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${locals.auth.user.id}-${Date.now()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert File to Buffer and save
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Update user's image URL in database
    const imageUrl = `/uploads/profiles/${fileName}`;
    await db
      .update(users)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.auth.user.id));

    return json({
      success: true,
      imageUrl: imageUrl,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return json({ error: "Failed to upload image" }, { status: 500 });
  }
};
