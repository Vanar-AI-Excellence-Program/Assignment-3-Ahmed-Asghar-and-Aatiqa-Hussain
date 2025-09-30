import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, email, name, context } = await request.json();

    if (!userId || !email || !name) {
      return json(
        { success: false, error: "Missing required information" },
        { status: 400 }
      );
    }

    // Verify user exists and email matches
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
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

    if (user.email !== email) {
      return json(
        {
          success: false,
          error: "Email does not match user account",
        },
        { status: 400 }
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
      user.name || "User",
      context || "registration"
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
    console.error("Send verification error:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
