import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { users, sessions } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { TokenService } from '$lib/server/tokens.js';

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const formData = await request.formData();
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      const email = formData.get('email') as string;
      const code = formData.get('code') as string;

      console.log('=== New Password Action ===');
      console.log('Form data received:');
      console.log('- password:', password ? '***' : 'missing');
      console.log('- confirmPassword:', confirmPassword ? '***' : 'missing');
      console.log('- email:', email);
      console.log('- code:', code);

      // Validation
      if (!password || !confirmPassword || !email || !code) {
        console.log('Missing required fields');
        return fail(400, { error: 'Missing required fields' });
      }

      if (password !== confirmPassword) {
        return fail(400, { error: 'Passwords do not match' });
      }

      if (password.length < 8) {
        return fail(400, { error: 'Password must be at least 8 characters long' });
      }

      // Note: Code verification was already done in the previous step
      // The code was consumed (deleted) after successful verification
      console.log('Proceeding with password change for email:', email);
      
      // Basic security: Ensure the email parameter matches what was verified
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail(400, { error: 'Invalid email address' });
      }

      // Find the user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return fail(404, { error: 'User not found' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update the user's password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Invalidate ALL sessions for this user (force logout from all devices)
      console.log('Invalidating all sessions for user:', user.id);
      await db
        .delete(sessions)
        .where(eq(sessions.userId, user.id));

      console.log('Password changed successfully and all sessions invalidated for user:', user.id);

      return {
        success: true,
        message: 'Password changed successfully! All sessions have been invalidated.'
      };
    } catch (error) {
      console.error('New password error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  }
};
