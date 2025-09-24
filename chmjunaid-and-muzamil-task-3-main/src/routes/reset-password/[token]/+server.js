import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST({ params, request }) {
  try {
    const { password } = await request.json();
    const { token } = params;

    if (!password || password.length < 6) {
      return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    if (!token) {
      return json({ error: 'Reset token is required' }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await db.select().from(users)
      .where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (user.length === 0) {
      return json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token with proper Date handling
    await db.update(users)
      .set({ 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date() // Update the updatedAt timestamp
      })
      .where(eq(users.id, user[0].id));

    return json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return json({ error: 'Failed to reset password' }, { status: 500 });
  }
} 