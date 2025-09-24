import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users, sessions, conversations, messages } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SessionManager } from '$lib/auth.js';

export async function POST({ request, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { password } = await request.json();
    
    if (!password) {
      return json({ error: 'Password is required' }, { status: 400 });
    }

    // Get current user with password
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).then(res => res[0]);
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return json({ error: 'Invalid password' }, { status: 400 });
    }

    // Prevent admin from deleting themselves (safety check)
    if (user.role === 'admin') {
      return json({ error: 'Admin accounts cannot be deleted through this interface. Please contact system administrator.' }, { status: 403 });
    }

    // Delete all user data in the correct order to handle foreign key constraints
    const userId = session.user.id;

    // 1. Delete all user sessions
    await SessionManager.deleteUserSessions(userId);

    // 2. Delete all conversations and messages (messages will be deleted due to cascade)
    await db.delete(conversations).where(eq(conversations.userId, userId));

    // 3. Delete the user account
    await db.delete(users).where(eq(users.id, userId));

    return json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
