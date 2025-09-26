import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { TokenService } from '$lib/server/tokens.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return json({ 
        message: 'If an account with that email exists, a password reset code has been sent.' 
      });
    }

    // Generate new password reset code
    console.log('Resending password reset code for user:', user.id);
    const resetCode = await TokenService.createPasswordResetCode(
      user.id,
      user.email,
      user.name || 'User',
      10 // 10 minutes expiry
    );
    console.log('Password reset code resent:', resetCode);

    return json({ 
      message: 'Password reset code sent to your email address.' 
    });
  } catch (error) {
    console.error('Resend password reset code error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
