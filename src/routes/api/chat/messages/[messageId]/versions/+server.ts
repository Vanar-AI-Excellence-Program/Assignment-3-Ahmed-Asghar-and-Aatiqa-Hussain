import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatMessages, chatConversations } from "$lib/server/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = params;

    // Get the message to find its version group
    const message = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .limit(1);

    if (!message.length) {
      // If the message isn't in DB (e.g., client-side temporary ID), return empty versions gracefully
      return json({ versions: [] });
    }

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, message[0].conversationId),
          eq(chatConversations.userId, locals.user.id)
        )
      )
      .limit(1);

    if (!conversation.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    // If this message has no version group yet, treat it as a single-version group
    if (!message[0].versionGroupId) {
      return json({ versions: [message[0]] });
    }

    // Get all versions of this message
    const versions = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.versionGroupId, message[0].versionGroupId))
      .orderBy(asc(chatMessages.versionNumber));

    return json({ versions });
  } catch (error) {
    console.error("Error getting versions:", error);
    return json({ error: "Failed to get versions" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = params;
    const { targetMessageId, direction } = await request.json();

    // Get the current message
    const currentMessage = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .limit(1);

    if (!currentMessage.length) {
      return json({ error: "Message not found" }, { status: 404 });
    }

    // Verify the conversation belongs to the user
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, currentMessage[0].conversationId),
          eq(chatConversations.userId, locals.user.id)
        )
      )
      .limit(1);

    if (!conversation.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    let targetMessage;

    if (targetMessageId) {
      // Switch to specific version
      const target = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, targetMessageId))
        .limit(1);

      if (!target.length) {
        return json({ error: "Target version not found" }, { status: 404 });
      }

      targetMessage = target[0];
    } else if (direction) {
      // Get all versions and find adjacent one
      const allVersions = await db
        .select()
        .from(chatMessages)
        .where(
          eq(chatMessages.versionGroupId, currentMessage[0].versionGroupId)
        )
        .orderBy(asc(chatMessages.versionNumber));

      const currentIndex = allVersions.findIndex(
        (v) => v.id === currentMessage[0].id
      );

      if (direction === "next" && currentIndex < allVersions.length - 1) {
        targetMessage = allVersions[currentIndex + 1];
      } else if (direction === "prev" && currentIndex > 0) {
        targetMessage = allVersions[currentIndex - 1];
      }
    } else {
      return json(
        { error: "Either targetMessageId or direction is required" },
        { status: 400 }
      );
    }

    if (!targetMessage) {
      return json({ error: "Target version not found" }, { status: 404 });
    }

    // 1) Deactivate current subtree (current message and all descendants)
    await db.execute(sql`
      WITH RECURSIVE to_deactivate AS (
        SELECT id FROM chat_messages WHERE id = ${currentMessage[0].id}
        UNION ALL
        SELECT m.id FROM chat_messages m
        JOIN to_deactivate td ON m."parent_id" = td.id
      )
      UPDATE chat_messages SET "is_active" = false WHERE id IN (SELECT id FROM to_deactivate);
    `);

    // 2) Ensure only the target version is active within its version group
    await db.execute(sql`
      UPDATE chat_messages 
      SET "is_active" = false 
      WHERE "version_group_id" = ${targetMessage.versionGroupId} AND id <> ${targetMessage.id};
    `);

    // 3) Activate the target message and its newest-child chain downstream
    await db.execute(sql`
      WITH RECURSIVE chain AS (
        SELECT id FROM chat_messages WHERE id = ${targetMessage.id}
        UNION ALL
        SELECT next_child.id
        FROM chain ch
        JOIN LATERAL (
          SELECT id 
          FROM chat_messages 
          WHERE "parent_id" = ch.id
          ORDER BY "timestamp" DESC, "version_number" DESC, id DESC
          LIMIT 1
        ) next_child ON true
      )
      UPDATE chat_messages SET "is_active" = true WHERE id IN (SELECT id FROM chain);
    `);

    return json({
      success: true,
      switchedTo: targetMessage,
    });
  } catch (error) {
    console.error("Error switching version:", error);
    return json({ error: "Failed to switch version" }, { status: 500 });
  }
};
