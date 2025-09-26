import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Validate and consume the token
    const result = await TokenService.consumeToken(token, "email_verification");

    if (!result.success || !result.userId) {
      return json(
        {
          success: false,
          error: "Invalid or expired verification token",
        },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.userId));

    return json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
