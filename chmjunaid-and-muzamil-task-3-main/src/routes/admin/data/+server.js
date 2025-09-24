import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';

export async function GET({ locals }) {
  const session = await locals.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  const currentUser = await db.select().from(users).where(eq(users.id, session.user.id)).then(res => res[0]);
  if (!currentUser || currentUser.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }
  const allUsers = await db.select().from(users);
  const stats = {
    total: allUsers.length,
    admins: allUsers.filter(u => u.role === 'admin').length
  };
  return new Response(JSON.stringify({ users: allUsers, currentUser, stats }), { status: 200 });
}