import { SvelteKitAuth } from "@auth/sveltekit";
import Credentials from "@auth/core/providers/credentials";
import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "$lib/server/db";
import { users, sessions, accounts } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    sessionsTable: sessions,
    accountsTable: accounts,
  }),
  providers: [
    // Google OAuth Provider
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    // GitHub OAuth Provider
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
    // Credentials Provider (existing email/password login)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated. Please contact support");
        }

        const valid = await bcrypt.compare(password, user.password as string);
        if (!valid) {
          throw new Error("Invalid email or password");
        }

        return { id: user.id, email: user.email, name: user.name } as any;
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // Custom account linking - we handle it manually in signIn callback
  // Additional OAuth configuration
  events: {
    async linkAccount({ user, account, profile }) {
      console.log(
        `🔗 Account linked: ${account.provider} for user ${user.email}`
      );
    },
    async createUser({ user, profile }) {
      console.log(`👤 New user created via OAuth: ${user.email}`);

      // Update user with profile image from OAuth provider
      if (user.id && profile?.picture) {
        try {
          await db
            .update(users)
            .set({
              image: profile.picture,
              name: profile.name || user.name,
              emailVerified: new Date(),
            })
            .where(eq(users.id, user.id));
          console.log(`🖼️ Updated user profile image: ${user.email}`);
        } catch (error) {
          console.error("❌ Error updating user profile:", error);
        }
      }
    },
  },
  callbacks: {
    // Redirect after successful sign in
    async redirect({ url, baseUrl }) {
      console.log(`🔄 Redirect callback - URL: ${url}, BaseURL: ${baseUrl}`);
      
      // If the URL is relative, make it absolute
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log(`✅ Redirecting to: ${redirectUrl}`);
        return redirectUrl;
      }
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        console.log(`✅ Redirecting to same origin: ${url}`);
        return url;
      }
      // Otherwise redirect to home page
      console.log(`✅ Redirecting to home page: ${baseUrl}`);
      return baseUrl;
    },

    // Handle OAuth sign-ins - let the adapter handle account creation
    async signIn({ user, account, profile }) {
      console.log(
        `🔐 SignIn callback - Provider: ${account?.provider}, Email: ${user?.email}`
      );

      // Allow OAuth sign-ins (Google & GitHub) - adapter will handle account creation
      if (account?.provider === "google" || account?.provider === "github") {
        console.log(
          `✅ Allowing ${account.provider} sign-in for: ${user.email}`
        );
        return true;
      }

      // For credentials provider, use existing logic
      if (account?.provider === "credentials") {
        return true;
      }

      console.log(`❌ Rejected sign-in for provider: ${account?.provider}`);
      return false;
    },

    // Enhance session with user data from database
    async session({ session }) {
      if (session.user?.email) {
        // Check if it's a regular user (email/password signup)
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, session.user.email),
        });

        if (dbUser && dbUser.password) {
          // Regular user (email/password signup) - has password field
          (session.user as any).id = dbUser.id;
          (session.user as any).role = dbUser.role;
          (session.user as any).isActive = dbUser.isActive;
          (session.user as any).name = dbUser.name;
          (session.user as any).image = dbUser.image;
          (session.user as any).emailVerified = dbUser.emailVerified;
          (session.user as any).createdAt = dbUser.createdAt;
          (session.user as any).updatedAt = dbUser.updatedAt;
          (session.user as any).userType = "regular";
        } else if (dbUser && !dbUser.password) {
          // OAuth user (created by adapter but no password)
          (session.user as any).id = dbUser.id;
          (session.user as any).role = dbUser.role || "user";
          (session.user as any).isActive = dbUser.isActive !== false; // Default to true
          (session.user as any).name = dbUser.name || session.user.name;
          // Use the image from OAuth provider (session.user.image) instead of database
          (session.user as any).image = session.user.image || dbUser.image;
          (session.user as any).emailVerified =
            dbUser.emailVerified || new Date();
          (session.user as any).createdAt = dbUser.createdAt;
          (session.user as any).updatedAt = dbUser.updatedAt;
          (session.user as any).userType = "oauth";

          // Get provider info from accounts table
          const oauthAccount = await db.query.accounts.findFirst({
            where: (accountsTable, { and, eq }) =>
              and(
                eq(accountsTable.userId, session.user.id),
                eq(accountsTable.provider, "google") // or check for both google and github
              ),
          });

          if (oauthAccount) {
            (session.user as any).provider = oauthAccount.provider;
          }
        }
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  // Security configuration
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.callback-url"
          : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
