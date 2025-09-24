import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all conversations for the user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));

    return json({ conversations: userConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json();
    const userId = session.user.id;

    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId,
        title: title || 'New Conversation'
      })
      .returning();

    return json({ conversation: newConversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return json({ error: 'Failed to create conversation' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await request.json();
    const userId = session.user.id;

    // Delete conversation (messages will be deleted due to cascade)
    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      );

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
};


