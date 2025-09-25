import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatMessages, chatConversations } from "$lib/server/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { aiService } from "$lib/server/ai";

export const POST: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = params;

    // Find the user message to regenerate response for
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
          eq(chatConversations.userId, locals.user.id!)
        )
      )
      .limit(1);

    if (!conversation.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    // Find existing assistant response to this user message (active)
    const existingAssistantMessage = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.parentId, userMessage[0].id),
          eq(chatMessages.role, "assistant"),
          eq(chatMessages.isActive, true)
        )
      )
      .orderBy(desc(chatMessages.timestamp))
      .limit(1);

    // Update conversation's updatedAt timestamp
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, userMessage[0].conversationId));

    // Get active conversation context for AI
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

    // Generate AI response
    const conversationHistory = conversationContext.slice(0, -1).map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
    
    const aiResponse = await aiService.generateContextualResponse(
      userMessage[0].content,
      conversationHistory
    );

    // Save new assistant response as a branch/version
    let regeneratedAssistantReply = null;
    let deactivatedIds: string[] = [];

    if (existingAssistantMessage.length) {
      // Determine the version group and next version number
      const groupId = existingAssistantMessage[0].versionGroupId;
      const maxVersion = await db
        .select({ v: sql`MAX("version_number")`.as("v") })
        .from(chatMessages)
        .where(eq(chatMessages.versionGroupId, groupId!))
        .then((res) => res[0]?.v || 1);

      const nextVersionNumber = Number(maxVersion) + 1;

      // Deactivate all versions in this group and their descendants
      const groupIdsResult = await db.execute(sql`
        SELECT id FROM chat_messages WHERE "version_group_id" = ${groupId}
      `);
      const groupIds = groupIdsResult.map((r) => r.id) || [];

      if (groupIds.length > 0) {
        const descendantsResult = await db.execute(sql`
          WITH RECURSIVE descendants AS (
            SELECT id FROM chat_messages WHERE id = ANY(ARRAY[${sql.raw(
              groupIds.join(",")
            )}])
            UNION ALL
            SELECT m.id FROM chat_messages m
            JOIN descendants d ON m."parent_id" = d.id
          )
          SELECT id FROM descendants;
        `);
        deactivatedIds = descendantsResult.map((r) => r.id as string) || [];

        if (deactivatedIds.length > 0) {
          await db.execute(sql`
            UPDATE chat_messages SET "is_active" = false 
            WHERE id = ANY(ARRAY[${sql.raw(deactivatedIds.join(","))}])
          `);
        }
      }

      // Insert the new assistant reply into the same version group
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          id: nanoid(),
          conversationId: userMessage[0].conversationId,
          content: aiResponse,
          role: "assistant",
          parentId: userMessage[0].id,
          versionGroupId: groupId,
          versionNumber: nextVersionNumber,
          isEdited: false,
          isActive: true,
          timestamp: new Date(),
        })
        .returning();

      regeneratedAssistantReply = newMessage;
    } else {
      // No existing assistant version: create the first one
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          id: nanoid(),
          conversationId: userMessage[0].conversationId,
          content: aiResponse,
          role: "assistant",
          parentId: userMessage[0].id,
          versionGroupId: nanoid(), // Generate unique version group ID
          versionNumber: 1,
          isEdited: false,
          isActive: true,
          timestamp: new Date(),
        })
        .returning();

      regeneratedAssistantReply = newMessage;
    }

    return json({
      success: true,
      regeneratedAssistantReply,
      deactivatedMessages: deactivatedIds,
    });
  } catch (error) {
    console.error("Error regenerating response:", error);
    return json({ error: "Failed to regenerate response" }, { status: 500 });
  }
};
