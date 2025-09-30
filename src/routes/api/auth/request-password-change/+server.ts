import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.auth?.user) {
      return json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

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

    // Verify the email matches the authenticated user
    if (user.id !== locals.auth.user.id) {
      return json(
        {
          success: false,
          error: "Email does not match your account",
        },
        { status: 403 }
      );
    }

    // Send password reset email
    const emailSent = await TokenService.sendPasswordReset(
      user.id,
      user.email,
      user.name || "User"
    );

    if (!emailSent) {
      return json(
        {
          success: false,
          error: "Failed to send password reset email",
        },
        { status: 500 }
      );
    }

    return json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Request password change error:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
