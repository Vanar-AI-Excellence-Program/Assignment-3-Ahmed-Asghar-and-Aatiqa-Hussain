import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { chatConversations } from "$lib/server/db/schema";
import { nanoid } from "nanoid";

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title || typeof title !== "string") {
      return json({ error: "Title is required" }, { status: 400 });
    }

    const conversationId = nanoid();

    // Create new conversation
    const [newConversation] = await db
      .insert(chatConversations)
      .values({
        id: conversationId,
        userId: locals.user.id,
        title: title.trim(),
        isAutoRenamed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return json({ conversation: newConversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return json({ error: "Failed to create conversation" }, { status: 500 });
  }
};
