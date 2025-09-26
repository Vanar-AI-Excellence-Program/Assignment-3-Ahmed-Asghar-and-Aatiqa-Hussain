import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatMessages, chatConversations } from "$lib/server/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (!conversation.length || conversation[0].userId !== locals.user.id) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get all active messages for the conversation
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          eq(chatMessages.isActive, true)
        )
      )
      .orderBy(asc(chatMessages.timestamp));

    return json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return json({ error: "Failed to fetch messages" }, { status: 500 });
  }
};
