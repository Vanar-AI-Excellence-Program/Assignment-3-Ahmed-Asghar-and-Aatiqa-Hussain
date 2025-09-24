import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/email.js';
import crypto from 'crypto';

export async function POST({ request }) {
  try {
    const { email } = await request.json();

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      // Don't reveal if email exists or not for security
      return json({ message: 'If your email is registered, you will receive a password reset link shortly.' });
    }

    // Generate reset token with proper Date object
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await db.update(users)
      .set({ 
        resetToken,
        resetTokenExpiry 
      })
      .where(eq(users.email, email));

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    return json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return json({ error: 'Failed to send password reset email' }, { status: 500 });
  }
} 