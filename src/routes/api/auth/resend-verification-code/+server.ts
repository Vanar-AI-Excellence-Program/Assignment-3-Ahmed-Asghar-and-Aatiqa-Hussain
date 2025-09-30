import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, email } = await request.json();

    // Validation
    if (!userId || !email) {
      return json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email matches
    if (user.email !== email) {
      return json(
        { error: "Email does not match user record" },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification code
    const verificationCode = await TokenService.createVerificationCode(
      userId,
      email,
      user.name || "User",
      10 // 10 minutes expiry
    );

    console.log(`New verification code generated for ${email}: ${verificationCode}`);

    return json({
      message: "New verification code sent to your email",
      success: true,
    });
  } catch (error) {
    console.error("Resend verification code error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
