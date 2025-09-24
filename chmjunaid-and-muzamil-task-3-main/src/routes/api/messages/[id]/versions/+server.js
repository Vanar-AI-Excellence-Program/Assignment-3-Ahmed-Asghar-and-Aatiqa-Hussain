import { db } from '$lib/db.js';
import { messages } from '$lib/schema.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export async function GET({ request, locals, params }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const messageId = parseInt(params.id);

    // Validate that the ID is a valid positive integer
    if (isNaN(messageId) || messageId <= 0 || messageId > 2147483647) {
      return new Response(JSON.stringify({
        error: 'Invalid message ID',
        details: `Message ID must be a valid positive integer, got: ${params.id}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the message to find its version group
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .then(res => res[0]);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all versions of this message
    const versions = await db
      .select()
      .from(messages)
      .where(eq(messages.versionGroupId, message.versionGroupId))
      .orderBy(asc(messages.versionNumber));

    return new Response(JSON.stringify({ versions }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get versions error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get versions',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, locals, params }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const messageId = parseInt(params.id);

    // Validate that the ID is a valid positive integer
    if (isNaN(messageId) || messageId <= 0 || messageId > 2147483647) {
      return new Response(JSON.stringify({
        error: 'Invalid message ID',
        details: `Message ID must be a valid positive integer, got: ${params.id}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { targetMessageId, direction } = await request.json();

    // Validate targetMessageId if provided
    if (targetMessageId !== undefined && targetMessageId !== null) {
      const targetId = parseInt(targetMessageId);
      if (isNaN(targetId) || targetId <= 0 || targetId > 2147483647) {
        return new Response(JSON.stringify({
          error: 'Invalid target message ID',
          details: `Target message ID must be a valid positive integer, got: ${targetMessageId}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get the current message
    const currentMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .then(res => res[0]);

    if (!currentMessage) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let targetMessage;

    if (targetMessageId) {
      // Switch to specific version
      targetMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.id, targetMessageId))
        .then(res => res[0]);
    } else if (direction) {
      // Get all versions and find adjacent one
      const allVersions = await db
        .select()
        .from(messages)
        .where(eq(messages.versionGroupId, currentMessage.versionGroupId))
        .orderBy(asc(messages.versionNumber));

      const currentIndex = allVersions.findIndex(v => v.id === currentMessage.id);
      
      if (direction === 'next' && currentIndex < allVersions.length - 1) {
        targetMessage = allVersions[currentIndex + 1];
      } else if (direction === 'prev' && currentIndex > 0) {
        targetMessage = allVersions[currentIndex - 1];
      }
    } else {
      return new Response(JSON.stringify({ error: 'Either targetMessageId or direction is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!targetMessage) {
      return new Response(JSON.stringify({ error: 'Target version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) Deactivate current subtree (current message and all descendants)
    await db.execute(sql`
      WITH RECURSIVE to_deactivate AS (
        SELECT id FROM message WHERE id = ${currentMessage.id}
        UNION ALL
        SELECT m.id FROM message m
        JOIN to_deactivate td ON m."parentId" = td.id
      )
      UPDATE message SET "isActive" = false WHERE id IN (SELECT id FROM to_deactivate);
    `);

    // 2) Ensure only the target version is active within its version group
    await db.execute(sql`
      UPDATE message 
      SET "isActive" = false 
      WHERE "versionGroupId" = ${targetMessage.versionGroupId} AND id <> ${targetMessage.id};
    `);

    // 3) Activate the target message and its newest-child chain downstream
    await db.execute(sql`
      WITH RECURSIVE chain AS (
        SELECT id FROM message WHERE id = ${targetMessage.id}
        UNION ALL
        SELECT next_child.id
        FROM chain ch
        JOIN LATERAL (
          SELECT id 
          FROM message 
          WHERE "parentId" = ch.id
          ORDER BY "createdAt" DESC, "versionNumber" DESC, id DESC
          LIMIT 1
        ) next_child ON true
      )
      UPDATE message SET "isActive" = true WHERE id IN (SELECT id FROM chain);
    `);

    return new Response(JSON.stringify({ 
      success: true,
      switchedTo: targetMessage
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Switch version error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to switch version',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
