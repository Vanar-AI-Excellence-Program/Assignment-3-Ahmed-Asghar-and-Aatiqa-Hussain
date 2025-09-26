import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { TokenService } from '$lib/server/tokens.js';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    try {
      console.log('=== Change Password Action Started ===');
      
      // Check if user is authenticated
      if (!locals.user) {
        return fail(401, { error: 'You must be logged in to change your password' });
      }
      
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

      // Verify that the email belongs to the current user
      if (email !== locals.user.email) {
        console.log('Email does not match current user:', { provided: email, current: locals.user.email });
        return fail(403, { error: 'You can only change password for your own account' });
      }

      // Check if user exists (should exist since they're logged in)
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        console.log('User not found for email:', email);
        return fail(404, { error: 'User not found' });
      }

      console.log('User found:', { id: user.id, email: user.email, name: user.name });

      // Generate password change verification code
      console.log('Generating password change verification code for user:', user.id);
      const verificationCode = await TokenService.createPasswordChangeCode(
        user.id,
        user.email,
        user.name || 'User',
        10 // 10 minutes expiry
      );
      console.log('Password change verification code generated:', verificationCode);

      return {
        success: true,
        message: 'Verification code sent to your email address.',
        email: user.email,
        redirectUrl: `/change-password-code?email=${encodeURIComponent(user.email)}`,
      };
    } catch (error) {
      console.error('Change password error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return fail(500, { error: 'Internal server error' });
    }
  }
};
