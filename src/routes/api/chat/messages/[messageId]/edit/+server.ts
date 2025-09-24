import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatMessages, chatConversations } from "$lib/server/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { aiService } from "$lib/server/ai";

export const POST: RequestHandler = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = params;
    const { content } = await request.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return json({ error: "Content is required" }, { status: 400 });
    }

    // Find the user message to edit
    const userMessage = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.role, "user")))
      .limit(1);

    if (!userMessage.length) {
      return json({ error: "User message not found" }, { status: 404 });
    }

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, userMessage[0].conversationId),
          eq(chatConversations.userId, locals.user.id)
        )
      )
      .limit(1);

    if (!conversation.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    // Determine version group and next version number for the edited USER message
    const userGroupId = userMessage[0].versionGroupId ?? nanoid();
    const maxUserVersionRow = await db
      .select({ v: sql`MAX("version_number")`.as("v") })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.versionGroupId, userGroupId),
          eq(chatMessages.role, "user")
        )
      );
    const currentUserMax = Number(maxUserVersionRow?.[0]?.v ?? 0);
    const nextUserVersion = currentUserMax + 1;

    // Create a new version of the user message with edited content
    const editedUserMessageId = nanoid();
    const [editedUserMessage] = await db
      .insert(chatMessages)
      .values({
        id: editedUserMessageId,
        conversationId: userMessage[0].conversationId,
        content: content.trim(),
        role: "user",
        parentId: userMessage[0].parentId, // Keep the same parent position in flow
        versionGroupId: userGroupId,
        versionNumber: nextUserVersion,
        isEdited: true,
        isActive: true,
        timestamp: new Date(),
      })
      .returning();

    // Deactivate the old user message and all its descendants
    await db.execute(sql`
      WITH RECURSIVE to_deactivate AS (
        SELECT id FROM chat_messages WHERE id = ${userMessage[0].id}
        UNION ALL
        SELECT m.id FROM chat_messages m
        JOIN to_deactivate td ON m."parent_id" = td.id
      )
      UPDATE chat_messages SET "is_active" = false WHERE id IN (SELECT id FROM to_deactivate);
    `);

    // Get active conversation context up to the edited message
    const conversationContext = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, userMessage[0].conversationId),
          eq(chatMessages.isActive, true)
        )
      )
      .orderBy(asc(chatMessages.timestamp));

    // Generate new AI response for the edited message
    const aiResponse = await aiService.generateContextualResponse(
      content.trim(),
      conversationContext
        .slice(0, -1)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
    );

    // Create new assistant response in its own version group (so future regenerations branch correctly)
    const assistantGroupId = nanoid();
    const [newAssistantMessage] = await db
      .insert(chatMessages)
      .values({
        id: nanoid(),
        conversationId: userMessage[0].conversationId,
        content: aiResponse,
        role: "assistant",
        parentId: editedUserMessageId,
        versionGroupId: assistantGroupId,
        versionNumber: 1,
        isEdited: false,
        isActive: true,
        timestamp: new Date(),
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, userMessage[0].conversationId));

    return json({
      success: true,
      editedUserMessage,
      newAssistantMessage,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    return json({ error: "Failed to edit message" }, { status: 500 });
  }
};
