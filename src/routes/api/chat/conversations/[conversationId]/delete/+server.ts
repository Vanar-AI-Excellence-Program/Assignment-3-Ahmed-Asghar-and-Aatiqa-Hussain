import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatConversations, chatMessages } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";

export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;

    // First, verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, locals.user.id)
        )
      )
      .limit(1);

    if (!conversation.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    // Delete all messages related to this conversation first
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId));

    // Then delete the conversation
    const deletedConversations = await db
      .delete(chatConversations)
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, locals.user.id)
        )
      )
      .returning();

    if (!deletedConversations.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    return json({
      success: true,
      message: "Conversation and all related messages deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return json({ error: "Failed to delete conversation" }, { status: 500 });
  }
};
