import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatConversations } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;
    const { title, markAutoRenamed = false } = await request.json();

    if (!title || typeof title !== "string") {
      return json({ error: "Title is required" }, { status: 400 });
    }

    // Ensure conversation belongs to user
    const updated = await db
      .update(chatConversations)
      .set({
        title: title.trim(),
        updatedAt: new Date(),
        ...(markAutoRenamed ? { isAutoRenamed: true } : {}),
      })
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, locals.user.id)
        )
      )
      .returning();

    if (!updated.length) {
      return json({ error: "Conversation not found" }, { status: 404 });
    }

    return json({ conversation: updated[0] });
  } catch (error) {
    console.error("Error renaming conversation:", error);
    return json({ error: "Failed to rename conversation" }, { status: 500 });
  }
};
