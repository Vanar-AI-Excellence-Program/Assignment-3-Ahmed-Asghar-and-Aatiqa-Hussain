import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user && user.isActive) {
      const emailSent = await TokenService.sendPasswordReset(
        user.id,
        user.email,
        user.name || "User"
      );

      if (!emailSent) {
        console.error("Failed to send password reset email to:", email);
      }
    }

    return json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
