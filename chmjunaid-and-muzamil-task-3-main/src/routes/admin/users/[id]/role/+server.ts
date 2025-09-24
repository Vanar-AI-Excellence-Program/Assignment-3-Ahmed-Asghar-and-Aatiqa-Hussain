import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session || session.user?.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { role } = await request.json();
    const userId = params.id;
    
    if (!role || !['admin', 'user'].includes(role)) {
      return json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Update user role in database
    await db.update(users)
      .set({ role })
      .where(eq(users.id, userId));
    
    return json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    return json({ error: 'Failed to update user role' }, { status: 500 });
  }
};
