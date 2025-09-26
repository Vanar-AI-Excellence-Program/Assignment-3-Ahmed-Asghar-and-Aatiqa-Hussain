import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";
import { EmailService } from "$lib/server/email";
import bcrypt from "bcryptjs";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return json(
        {
          success: false,
          error: "Token and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Validate and consume the token
    const result = await TokenService.consumeToken(token, "password_reset");

    if (!result.success || !result.userId) {
      return json(
        {
          success: false,
          error: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.userId));

    // Get user details for confirmation email
    const user = await db.query.users.findFirst({
      where: eq(users.id, result.userId),
    });

    if (user) {
      // Send confirmation email
      await EmailService.sendPasswordResetConfirmation(
        user.email,
        user.name || "User"
      );
    }

    return json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
