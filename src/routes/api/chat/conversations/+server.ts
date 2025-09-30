import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatConversations, chatMessages } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all conversations for the user
    const conversations = await db
      .select({
        id: chatConversations.id,
        title: chatConversations.title,
        createdAt: chatConversations.createdAt,
        updatedAt: chatConversations.updatedAt,
      })
      .from(chatConversations)
      .where(eq(chatConversations.userId, locals.user.id))
      .orderBy(desc(chatConversations.updatedAt));

    // Count messages for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const msgs = await db
          .select({ id: chatMessages.id })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id));

        return {
          ...conv,
          messageCount: msgs.length,
        };
      })
    );

    return json({ conversations: conversationsWithCounts });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
};
