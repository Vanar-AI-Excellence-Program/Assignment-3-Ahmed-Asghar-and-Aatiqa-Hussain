import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { TokenService } from '$lib/server/tokens.js';

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      console.log('=== Forgot Password Action Started ===');
      const formData = await request.formData();
      const email = formData.get('email') as string;
      console.log('Email received:', email);

      // Validation
      if (!email) {
        console.log('No email provided');
        return fail(400, { error: 'Email address is required' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.log('Invalid email format:', email);
        return fail(400, { error: 'Please enter a valid email address' });
      }

      // Check if user exists
      console.log('Looking for user with email:', email);
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        console.log('User not found for email:', email);
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If an account with that email exists, a password reset code has been sent.',
        };
      }

      console.log('User found:', { id: user.id, email: user.email, name: user.name });

      // Generate password reset code
      console.log('Generating password reset code for user:', user.id);
      const resetCode = await TokenService.createPasswordResetCode(
        user.id,
        user.email,
        user.name || 'User',
        10 // 10 minutes expiry
      );
      console.log('Password reset code generated:', resetCode);

      return {
        success: true,
        message: 'Password reset code sent to your email address.',
        email: user.email,
        redirectUrl: `/reset-password-code?email=${encodeURIComponent(user.email)}`,
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return fail(500, { error: 'Internal server error' });
    }
  }
};
