import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { sendWelcomeEmail } from '$lib/email.js';

export async function POST({ request }) {
  try {
    const { token } = await request.json();

    if (!token) {
      return json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Find user with valid verification token
    const user = await db.select().from(users)
      .where(
        and(
          eq(users.verificationToken, token),
          gt(users.verificationTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (user.length === 0) {
      return json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    // Mark email as verified with proper Date handling
    await db.update(users)
      .set({ 
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date() // Update the updatedAt timestamp
      })
      .where(eq(users.id, user[0].id));

    // Send welcome email
    try {
      await sendWelcomeEmail(user[0].email, user[0].name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    return json({ 
      message: 'Email verified successfully',
      email: user[0].email
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return json({ error: 'Failed to verify email' }, { status: 500 });
  }
} 