import { redirect, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { TokenService } from "$lib/server/tokens";

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if not authenticated
  if (!locals.auth?.user) {
    throw redirect(303, "/login");
  }

  return {
    user: locals.auth.user,
  };
};

export const actions: Actions = {
  default: async ({ locals }) => {
    try {
      console.log("Change password action started");

      // Check if user is authenticated
      if (!locals.auth?.user) {
        console.log("User not authenticated");
        return fail(401, {
          error: "Authentication required",
        });
      }

      // Use the authenticated user's email directly (no form data needed)
      const user = locals.auth.user;
      console.log("User authenticated:", {
        id: user.id,
        email: user.email,
        name: user.name,
      });

      // Send password reset email using the authenticated user's email
      console.log("Sending password reset email...");
      const emailSent = await TokenService.sendPasswordReset(
        user.id,
        user.email,
        user.name || "User"
      );

      console.log("Email sent result:", emailSent);

      if (!emailSent) {
        console.log("Failed to send email");
        return fail(500, {
          error: "Failed to send password reset email",
        });
      }

      // Redirect to check email page with user's email
      const redirectUrl = `/checks/check-email?context=password-change&email=${encodeURIComponent(
        user.email
      )}&userId=${user.id}&name=${encodeURIComponent(
        user.name || "User"
      )}&sent=true`;

      console.log("Redirecting to:", redirectUrl);
      throw redirect(303, redirectUrl);
    } catch (error) {
      // Check if this is a redirect (which is expected and should be re-thrown)
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        "location" in error
      ) {
        console.log("Redirect (this is expected):", error);
        throw error; // Re-throw redirect
      }

      console.error("Request password change error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return fail(500, {
        error: "Internal server error",
      });
    }
  },
};
