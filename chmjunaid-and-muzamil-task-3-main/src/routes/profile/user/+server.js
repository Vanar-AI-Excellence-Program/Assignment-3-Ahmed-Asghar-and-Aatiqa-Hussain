import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';

export async function GET({ locals }) {
  const session = await locals.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  const user = await db.select().from(users).where(eq(users.id, session.user.id)).then(res => res[0]);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }), { status: 200 });
}

export async function POST({ locals, request }) {
  const session = await locals.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  const { name } = await request.json();
  if (!name) {
    return new Response(JSON.stringify({ error: 'Name is required.' }), { status: 400 });
  }
  
  // Update user with proper Date handling
  await db.update(users)
    .set({ 
      name,
      updatedAt: new Date() // Update the updatedAt timestamp
    })
    .where(eq(users.id, session.user.id));
    
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}