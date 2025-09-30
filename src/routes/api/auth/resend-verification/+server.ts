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

    if (!user) {
      return json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return json(
        {
          success: false,
          error: "Email is already verified",
        },
        { status: 400 }
      );
    }

    // Send verification email
    const emailSent = await TokenService.sendEmailVerification(
      user.id,
      user.email,
      user.name || "User"
    );

    if (!emailSent) {
      return json(
        {
          success: false,
          error: "Failed to send verification email",
        },
        { status: 500 }
      );
    }

    return json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
