import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST({ request, locals }) {
  try {
    const session = await locals.getSession();
    
    if (!session) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return json({ error: 'Current password and new password are required' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }
    
    // Get user from database
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    
    if (user.length === 0) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user[0].password);
    
    if (!isCurrentPasswordValid) {
      return json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password in database
    await db.update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date() // Update the updatedAt timestamp
      })
      .where(eq(users.id, session.user.id));
    
    return json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return json({ error: 'Failed to update password' }, { status: 500 });
  }
}
