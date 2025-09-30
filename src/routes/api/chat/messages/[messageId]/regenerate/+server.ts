import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatMessages, chatConversations } from "$lib/server/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { aiService } from "$lib/server/ai";

export const POST: RequestHandler = async ({ locals, params }) => {
  try {
    const auth = locals.auth as any;
    if (!auth?.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = params;

    // Find the user message to regenerate response for
    // messageId could be either a user message ID or assistant message ID
    let userMessage;

    // First try to find as user message
    userMessage = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.role, "user")))
      .limit(1);

    // If not found as user message, try to find the parent user message of an assistant message
    if (!userMessage.length) {
      const assistantMessage = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.id, messageId),
            eq(chatMessages.role, "assistant")
          )
        )
        .limit(1);

      if (assistantMessage.length && assistantMessage[0].parentId) {
        userMessage = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.id, assistantMessage[0].parentId))
          .limit(1);
      }
    }

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
          eq(chatConversations.userId, auth.user.id)
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

    // Create a readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Format conversation history for AI: include only messages before the target user message
          const targetTime = new Date(
            userMessage[0].timestamp as unknown as string
          );
          const history = conversationContext
            .filter(
              (msg) => new Date(msg.timestamp as unknown as string) < targetTime
            )
            .map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            }));

          // Generate streaming AI response with proper context
          const responseStream = aiService.generateContextualStreamingResponse(
            userMessage[0].content,
            history,
            auth.user.name || "User",
            auth.user.id,
            "gemini-2.5-pro"
          );

          let fullResponse = "";

          for await (const chunk of responseStream) {
            if (chunk) {
              fullResponse += chunk;

              const data =
                JSON.stringify({
                  type: "chunk",
                  content: chunk,
                  timestamp: new Date().toISOString(),
                }) + "\n";

              controller.enqueue(new TextEncoder().encode(data));
            }
          }

          // Save new assistant response as a branch/version
          let regeneratedAssistantReply = null;
          let deactivatedIds = [];

          if (fullResponse.trim()) {
            if (existingAssistantMessage.length) {
              // Determine the version group and next version number
              const groupId = existingAssistantMessage[0].versionGroupId;
              const maxVersion = await db
                .select({ v: sql`MAX("version_number")`.as("v") })
                .from(chatMessages)
                .where(eq(chatMessages.versionGroupId, groupId))
                .then((res) => res[0]?.v || 1);

              const nextVersionNumber = Number(maxVersion) + 1;

              // Deactivate all versions in this group and their descendants
              await db.execute(sql`
                WITH RECURSIVE to_deactivate AS (
                  SELECT id FROM chat_messages WHERE "version_group_id" = ${groupId}
                  UNION ALL
                  SELECT m.id FROM chat_messages m
                  JOIN to_deactivate td ON m."parent_id" = td.id
                )
                UPDATE chat_messages SET "is_active" = false WHERE id IN (SELECT id FROM to_deactivate);
              `);

              // Insert the new assistant reply into the same version group
              const [newMessage] = await db
                .insert(chatMessages)
                .values({
                  id: nanoid(),
                  conversationId: userMessage[0].conversationId,
                  content: fullResponse,
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
                  content: fullResponse,
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
          }

          // Send completion signal
          const completionData =
            JSON.stringify({
              type: "complete",
              regeneratedAssistantReply,
              deactivatedMessages: deactivatedIds,
              timestamp: new Date().toISOString(),
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(completionData));
          controller.close();
        } catch (error) {
          console.error("Regenerate streaming error:", error);
          const errorData =
            JSON.stringify({
              type: "error",
              error: "Failed to regenerate response",
              timestamp: new Date().toISOString(),
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error regenerating response:", error);
    return json({ error: "Failed to regenerate response" }, { status: 500 });
  }
};
