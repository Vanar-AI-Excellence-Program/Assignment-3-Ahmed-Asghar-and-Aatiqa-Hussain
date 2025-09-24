// @ts-nocheck
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';
import Credentials from '@auth/core/providers/credentials';
// import Email from '@auth/core/providers/email';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db.js';
import { users, accounts, sessions, verificationTokens } from './schema.js';
import bcrypt from 'bcryptjs';
import { eq, and, lt } from 'drizzle-orm';

// Initialize the adapter first
const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens
});

export const authOptions = {
  trustHost: true,
  debug: true,
  adapter,
  // Force database sessions - requires adapter to be set
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    generateSessionToken: () => randomUUID(),
  },
  // Cookie security per environment
  // useSecureCookies: process.env.NODE_ENV === 'production', // Let Auth.js handle this automatically
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      /** @param {any} credentials @param {Request} req */
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        // Find user by email
        const user = await db.select().from(users).where(eq(users.email, credentials.email)).then(res => res[0]);
        if (!user) return null;
        // Require email verification for credentials sign-in
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in.');
        }
        // Compare password - use 'password' column, not 'passwordHash'
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        // Return user object with string id to ensure adapter/session creation works consistently
        return { id: String(user.id), email: user.email, name: user.name, role: user.role };
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email'
        }
      }
    }),
    // Email({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM
    // })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      if (!session?.user) return session;
      // Prefer fresh user from DB to ensure we always include id and role
      try {
        const email = user?.email ?? session.user.email;
        if (email) {
          const dbUser = await db.select().from(users).where(eq(users.email, email)).then(r => r[0]);
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.email = dbUser.email;
            session.user.role = dbUser.role;
            session.user.name = dbUser.name ?? session.user.name;
            session.user.image = dbUser.image ?? session.user.image;
          }
        }
      } catch (_) {}
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('[AuthJS] signIn callback', { 
        user: user ? { id: user.id, email: user.email } : null, 
        account: account ? { provider: account.provider, type: account.type } : null 
      });
      
      // For credentials provider, create account record if it doesn't exist
      if (account?.provider === 'credentials' && user) {
        console.log('[AuthJS] Credentials sign-in approved for user:', user.email);
        
        // Create/link account for credentials if needed
        try {
          const existingAccount = await db.select().from(accounts).where(
            and(
              eq(accounts.provider, 'credentials'),
              eq(accounts.userId, parseInt(user.id))
            )
          ).limit(1);
          
          if (existingAccount.length === 0) {
            await db.insert(accounts).values({
              userId: parseInt(user.id),
              type: 'credentials',
              provider: 'credentials',
              providerAccountId: user.id
            });
            console.log('[AuthJS] Created credentials account for user:', user.email);
          }
        } catch (error) {
          console.error('[AuthJS] Error creating credentials account:', error);
        }
        
        return true;
      }
      
      return true;
    },
    // Use default redirect behavior
  },
  events: {
    async createSession(message) {
      try { console.log('[AuthJS] createSession', { userId: message?.session?.user?.id, sessionToken: message?.session?.sessionToken }); } catch {}
    },
    async session(message) {
      try { console.log('[AuthJS] session', { email: message?.session?.user?.email }); } catch {}
    },
    async updateSession(message) {
      try { console.log('[AuthJS] updateSession'); } catch {}
    },
    async signIn(message) {
      try { console.log('[AuthJS] signIn', { provider: message?.account?.provider, email: message?.user?.email }); } catch {}
    }
  }
};

export const handleAuth = SvelteKitAuth(authOptions);

// Session management utilities
export class SessionManager {
  /**
   * Create a new session for a user
   * @param {string} sessionToken - Unique session token
   * @param {number} userId - User ID
   * @param {Date} expires - Expiration date
   * @returns {Promise<Object>} Created session
   */
  static async createSession(sessionToken, userId, expires) {
    try {
      const [session] = await db.insert(sessions).values({
        sessionToken,
        userId,
        expires
      }).returning();
      
      console.log(`[SessionManager] Created session for user ${userId}`);
      return session;
    } catch (error) {
      console.error('[SessionManager] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get session by session token
   * @param {string} sessionToken - Session token to look up
   * @returns {Promise<Object|null>} Session object or null if not found
   */
  static async getSession(sessionToken) {
    try {
      const [session] = await db.select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken));
      
      if (!session) return null;
      
      // Check if session is expired
      if (new Date() > session.expires) {
        await this.deleteSession(sessionToken);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('[SessionManager] Error getting session:', error);
      return null;
    }
  }

  /**
   * Get session with user data
   * @param {string} sessionToken - Session token to look up
   * @returns {Promise<Object|null>} Session with user data or null if not found
   */
  static async getSessionWithUser(sessionToken) {
    try {
      const [session] = await db.select({
        session: sessions,
        user: users
      })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken));
      
      if (!session) return null;
      
      // Check if session is expired
      if (new Date() > session.session.expires) {
        await this.deleteSession(sessionToken);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('[SessionManager] Error getting session with user:', error);
      return null;
    }
  }

  /**
   * Update session expiration
   * @param {string} sessionToken - Session token to update
   * @param {Date} expires - New expiration date
   * @returns {Promise<Object|null>} Updated session or null if not found
   */
  static async updateSession(sessionToken, expires) {
    try {
      const [session] = await db.update(sessions)
        .set({ expires })
        .where(eq(sessions.sessionToken, sessionToken))
        .returning();
      
      console.log(`[SessionManager] Updated session ${sessionToken}`);
      return session;
    } catch (error) {
      console.error('[SessionManager] Error updating session:', error);
      return null;
    }
  }

  /**
   * Delete a specific session
   * @param {string} sessionToken - Session token to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteSession(sessionToken) {
    try {
      await db.delete(sessions)
        .where(eq(sessions.sessionToken, sessionToken));
      
      console.log(`[SessionManager] Deleted session ${sessionToken}`);
      return true;
    } catch (error) {
      console.error('[SessionManager] Error deleting session:', error);
      return false;
    }
  }

  /**
   * Delete all sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteUserSessions(userId) {
    try {
      await db.delete(sessions)
        .where(eq(sessions.userId, userId));
      
      console.log(`[SessionManager] Deleted all sessions for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[SessionManager] Error deleting user sessions:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of deleted sessions
   */
  static async cleanupExpiredSessions() {
    try {
      const now = new Date();
      const result = await db.delete(sessions)
        .where(lt(sessions.expires, now))
        .returning();
      
      const deletedCount = result.length;
      console.log(`[SessionManager] Cleaned up ${deletedCount} expired sessions`);
      return deletedCount;
    } catch (error) {
      console.error('[SessionManager] Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get active sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of active sessions
   */
  static async getUserActiveSessions(userId) {
    try {
      const now = new Date();
      const userSessions = await db.select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            lt(now, sessions.expires)
          )
        );
      
      return userSessions;
    } catch (error) {
      console.error('[SessionManager] Error getting user active sessions:', error);
      return [];
    }
  }

  /**
   * Get session count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of active sessions
   */
  static async getUserSessionCount(userId) {
    try {
      const now = new Date();
      const result = await db.select({ count: sessions.id })
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            lt(now, sessions.expires)
          )
        );
      
      return result.length;
    } catch (error) {
      console.error('[SessionManager] Error getting user session count:', error);
      return 0;
    }
  }
}
