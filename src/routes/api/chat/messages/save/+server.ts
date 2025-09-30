import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatMessages, chatConversations } from "$lib/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, role, content, attachedFile } = await request.json();

    if (!conversationId || !role || !content) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["user", "assistant"].includes(role)) {
      return json({ error: "Invalid role" }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (!conversation.length || conversation[0].userId !== locals.user.id) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    const messageId = nanoid();

    // Get the last message to set as parent
    const lastMessage = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(1);

    // Save the message with tree structure
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        id: messageId,
        conversationId,
        role,
        content: content.trim(),
        parentId: lastMessage[0]?.id || null,
        versionGroupId: nanoid(), // Generate unique version group ID
        versionNumber: 1,
        isEdited: false,
        isActive: true,
        attachedFile: attachedFile || null,
        timestamp: new Date(),
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId));

    return json({ message: newMessage });
  } catch (error) {
    console.error("Error saving message:", error);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};
