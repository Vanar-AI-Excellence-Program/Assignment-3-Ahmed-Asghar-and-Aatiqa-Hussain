import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET({ params, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const conversationId = parseInt(params.id);
    const userId = session.user.id;

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .then(res => res[0]);

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get only active messages for the conversation (active branch)
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isActive, true)
        )
      )
      .orderBy(asc(messages.createdAt));

    return new Response(JSON.stringify({
      conversation,
      messages: allMessages
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error loading conversation messages:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load conversation messages',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Optional: Get all versions of a specific message
export async function POST({ request, locals, params }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { messageId } = await request.json();
    const conversationId = parseInt(params.id);
    const userId = session.user.id;

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .then(res => res[0]);

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all versions of the specified message
    const messageVersions = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.id, messageId)
        )
      )
      .orderBy(desc(messages.versionNumber));

    if (messageVersions.length === 0) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Also get all versions that have this message as parent
    const childVersions = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.parentId, messageId)
        )
      )
      .orderBy(desc(messages.versionNumber));

    const allVersions = [...messageVersions, ...childVersions]
      .sort((a, b) => b.versionNumber - a.versionNumber);

    return new Response(JSON.stringify({
      messageVersions: allVersions
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get message versions error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get message versions',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
