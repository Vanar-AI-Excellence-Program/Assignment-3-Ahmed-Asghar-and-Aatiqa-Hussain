import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { TokenService } from '$lib/server/tokens.js';

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const formData = await request.formData();
      const code = formData.get('code') as string;
      const userId = formData.get('userId') as string;
      const email = formData.get('email') as string;

      // Validation
      if (!code || !userId || !email) {
        return fail(400, { error: 'Missing required fields' });
      }

      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return fail(400, { error: 'Please enter a valid 6-digit code' });
      }

      // Verify the code
      console.log('Verifying code:', { code, userId, email });
      const isValid = await TokenService.validateVerificationCode(code, userId);
      console.log('Code validation result:', isValid);
      
      if (!isValid) {
        console.log('Code validation failed');
        return fail(400, { error: 'Invalid or expired verification code' });
      }

      // Consume the code (delete it)
      const consumed = await TokenService.consumeVerificationCode(code, userId);
      
      if (!consumed) {
        return fail(400, { error: 'Failed to verify code' });
      }

      // Update user's email verification status
      await db
        .update(users)
        .set({
          emailVerified: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: 'Email verified successfully!'
      };
    } catch (error) {
      console.error('Verification error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  }
};
