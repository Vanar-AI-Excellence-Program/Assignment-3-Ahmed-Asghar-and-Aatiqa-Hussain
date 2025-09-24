import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users, conversations, messages } from '$lib/schema.js';
import { eq, count } from 'drizzle-orm';

export async function GET({ params, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user details
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0]);

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Get real conversation and message counts for this user
    const [userConversationsResult, userMessagesResult] = await Promise.all([
      db.select({ count: count() }).from(conversations).where(eq(conversations.userId, userId)),
      db.select({ count: count() })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.userId, userId))
    ]);

    const totalConversations = userConversationsResult[0]?.count || 0;
    const totalMessages = userMessagesResult[0]?.count || 0;

    // Mock data for sessions and activities until tables are created
    const mockSessions = [
      {
        id: 1,
        sessionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        logoutTime: null,
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        sessionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        logoutTime: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        isActive: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const mockActivities = [
      {
        id: 1,
        activityType: 'login',
        description: 'User logged in successfully',
        metadata: { loginMethod: 'credentials', ipAddress: '192.168.1.100' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        activityType: 'chat',
        description: 'Started new conversation',
        metadata: { conversationId: 1, messageCount: 5 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        activityType: 'profile_update',
        description: 'Updated profile information',
        metadata: { field: 'name', previousValue: 'Old Name', newValue: user.name },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      sessions: mockSessions,
      activities: mockActivities,
      stats: {
        totalChatMessages: totalMessages,
        totalConversations: totalConversations,
        lastActivityAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}
