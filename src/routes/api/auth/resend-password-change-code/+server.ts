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
        message: 'If an account with that email exists, a password change verification code has been sent.' 
      });
    }

    // Generate new password change verification code
    console.log('Resending password change verification code for user:', user.id);
    const verificationCode = await TokenService.createPasswordChangeCode(
      user.id,
      user.email,
      user.name || 'User',
      10 // 10 minutes expiry
    );
    console.log('Password change verification code resent:', verificationCode);

    return json({ 
      message: 'Password change verification code sent to your email address.' 
    });
  } catch (error) {
    console.error('Resend password change code error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
