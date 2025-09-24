import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { conversations, messages } from '$lib/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = url.searchParams.get('conversationId');
    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, parseInt(conversationId)),
          eq(conversations.userId, userId)
        )
      )
      .then(res => res[0]);

    if (!conversation) {
      return json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get all messages for the conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parseInt(conversationId)))
      .orderBy(asc(messages.createdAt));

    return json({ messages: conversationMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content, role } = await request.json();
    const userId = session.user.id;

    if (!conversationId || !content || !role) {
      return json({ error: 'Conversation ID, content, and role are required' }, { status: 400 });
    }

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
      return json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        content,
        role
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return json({ message: newMessage });
  } catch (error) {
    console.error('Error saving message:', error);
    return json({ error: 'Failed to save message' }, { status: 500 });
  }
};
