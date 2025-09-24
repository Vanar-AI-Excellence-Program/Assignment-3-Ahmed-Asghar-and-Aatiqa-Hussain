import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const session = await locals.getSession();
    
    if (!session || session.user?.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = params.id;
    
    // Prevent admin from deleting themselves
    if (session.user.id === userId) {
      return json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    // Delete user from database
    await db.delete(users).where(eq(users.id, userId));
    
    return json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return json({ error: 'Failed to delete user' }, { status: 500 });
  }
};
