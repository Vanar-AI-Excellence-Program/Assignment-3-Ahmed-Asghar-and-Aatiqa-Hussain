import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { handle as authHandle } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users, sessions } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { addSecurityHeaders } from "$lib/server/security";

// Auth.js handle for database sessions
const authenticationHandle: Handle = authHandle;

// Custom handle for session management and route protection
const authorizationHandle: Handle = async ({ event, resolve }) => {
  // Try to get Auth.js session first (for database sessions)
  let authSession = null;
  try {
    authSession = await event.locals.getSession?.();
    if (process.env.NODE_ENV === "development") {
      console.log("Auth.js session:", authSession);
    }
  } catch (error) {
    // Auth.js session might be invalid, ignore error
    if (process.env.NODE_ENV === "development") {
      console.log("Auth.js session error:", error);
    }
    authSession = null;
  }

  // If no Auth.js session, try to get custom session (fallback)
  let customSession = null;
  if (!authSession) {
    // Debug: log all cookies (development only)
    if (process.env.NODE_ENV === "development") {
      console.log(
        "All cookies:",
        Array.from(event.cookies.getAll()).map((c) => c.name)
      );
    }

    // Try different possible cookie names
    const sessionToken =
      event.cookies.get("authjs.session-token") ||
      event.cookies.get("__Secure-authjs.session-token") ||
      event.cookies.get("authjs.session");
    console.log("Session token found:", !!sessionToken);
    if (sessionToken) {
      try {
        const session = await db.query.sessions.findFirst({
          where: eq(sessions.sessionToken, sessionToken),
        });

        if (session && session.expires > new Date()) {
          const user = await db.query.users.findFirst({
            where: eq(users.id, session.userId),
          });

          if (user && user.isActive) {
            customSession = {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
            };
          }
        }
      } catch (error) {
        console.error("Custom session error:", error);
      }
    }
  }

  // Use whichever session is available, prioritizing Auth.js session
  event.locals.auth = authSession || customSession;

  // Set user in locals for API routes
  if (event.locals.auth?.user) {
    event.locals.user = event.locals.auth.user;
  }

  const pathname = event.url.pathname;
  const publicPaths = new Set<string>([
    "/",
    "/login",
    "/register",
    "/logout",
    "/verify-code",
    "/forgot-password",
    "/reset-password-code",
    "/reset-password",
    "/change-password",
    "/change-password-code",
    "/new-password",
    "/checks/check-email",
    // Auth.js callback routes
    "/auth/signin",
    "/auth/signout",
    "/auth/callback",
    "/auth/error",
  ]);
  const isPublic = publicPaths.has(pathname) || pathname.startsWith("/auth/");

  // Only redirect for page routes, not API routes
  if (!isPublic && !event.locals.auth && !pathname.startsWith("/api/")) {
    throw redirect(303, "/login");
  }

  if (pathname.startsWith("/admin")) {
    const role = (event.locals.auth as any)?.user?.role;
    if (role !== "admin") throw redirect(303, "/");
  }

  const response = await resolve(event);

  // Add security headers
  if (response) {
    addSecurityHeaders(response);
  }

  return response;
};

// Sequence the handles so Auth.js runs first, then our custom logic
export const handle = sequence(authenticationHandle, authorizationHandle);
