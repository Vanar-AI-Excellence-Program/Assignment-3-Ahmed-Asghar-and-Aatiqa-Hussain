import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { users, sessions } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { COOKIE_SECURITY_CONFIG } from "$lib/server/security";

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if already authenticated
  if (locals.auth?.user) {
    throw redirect(303, "/");
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    try {
      const data = await request.formData();
      const email = data.get("email") as string;
      const password = data.get("password") as string;

      if (!email || !password) {
        return fail(400, { error: "Email and password are required" });
      }

      // Manual validation
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (!user || !user.password) {
        return fail(400, { error: "Invalid email or password" });
      }

      if (!user.emailVerified) {
        return fail(400, {
          error: "Please verify your email before logging in.",
        });
      }

      if (!user.isActive) {
        return fail(400, {
          error: "Account is deactivated. Please contact support.",
        });
      }

      const valid = await bcrypt.compare(password, user.password as string);
      if (!valid) {
        return fail(400, { error: "Invalid email or password" });
      }

      // Create database session manually (Auth.js style)
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(sessions).values({
        sessionToken,
        userId: user.id,
        expires,
      });

      // Set session cookie with security configuration
      const cookieName =
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token";
      cookies.set(cookieName, sessionToken, COOKIE_SECURITY_CONFIG);

      // Redirect after successful login
      console.log(`📍 Login server action - Redirecting to home page: /`);
      throw redirect(303, "/");
    } catch (err: unknown) {
      // Re-throw SvelteKit redirects
      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        "location" in err
      ) {
        throw err as any;
      }
      console.error("Login error:", err);
      return fail(500, { error: "Login failed. Please try again." });
    }
  },
};
