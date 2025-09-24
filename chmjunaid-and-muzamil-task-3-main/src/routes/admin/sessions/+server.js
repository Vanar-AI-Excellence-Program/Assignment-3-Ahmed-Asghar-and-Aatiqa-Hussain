import { json } from '@sveltejs/kit';
import { SessionManager } from '$lib/auth.js';
import { db } from '$lib/db.js';
import { sessions, users } from '$lib/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function GET({ url, locals }) {
  try {
    // Check if user is authenticated and is admin
    const session = await locals.getSession();
    if (!session?.user || session.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const userId = url.searchParams.get('userId');
    const offset = (page - 1) * limit;

    let query = db.select({
      session: sessions,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id));

    if (userId) {
      query = query.where(eq(sessions.userId, parseInt(userId)));
    }

    const allSessions = await query
      .orderBy(desc(sessions.expires))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: sessions.id }).from(sessions);
    if (userId) {
      countQuery = countQuery.where(eq(sessions.userId, parseInt(userId)));
    }
    const totalCount = await countQuery.then(res => res.length);

    return json({
      sessions: allSessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('[Admin Sessions GET] Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE({ request, locals }) {
  try {
    // Check if user is authenticated and is admin
    const session = await locals.getSession();
    if (!session?.user || session.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionToken, userId } = await request.json();

    if (sessionToken) {
      // Delete specific session
      const success = await SessionManager.deleteSession(sessionToken);
      if (success) {
        return json({ message: 'Session deleted successfully' });
      } else {
        return json({ error: 'Failed to delete session' }, { status: 400 });
      }
    } else if (userId) {
      // Delete all sessions for a user
      const success = await SessionManager.deleteUserSessions(userId);
      if (success) {
        return json({ message: 'All user sessions deleted successfully' });
      } else {
        return json({ error: 'Failed to delete user sessions' }, { status: 400 });
      }
    } else {
      return json({ error: 'Either sessionToken or userId must be provided' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Admin Sessions DELETE] Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    // Check if user is authenticated and is admin
    const session = await locals.getSession();
    if (!session?.user || session.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'cleanup') {
      // Clean up expired sessions
      const deletedCount = await SessionManager.cleanupExpiredSessions();
      return json({ 
        message: `Cleanup completed successfully`, 
        deletedCount 
      });
    } else {
      return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Admin Sessions POST] Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
