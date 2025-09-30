import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { TokenService } from '$lib/server/tokens.js';

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const formData = await request.formData();
      const code = formData.get('code') as string;
      const email = formData.get('email') as string;

      console.log('=== Password Change Code Verification ===');
      console.log('Raw form data received:');
      console.log('- code:', code, '(type:', typeof code, ', length:', code?.length, ')');
      console.log('- email:', email, '(type:', typeof email, ')');

      // Validation
      if (!code || !email) {
        console.log('Missing required fields - code:', !!code, 'email:', !!email);
        return fail(400, { error: 'Missing required fields' });
      }

      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        console.log('Invalid code format - length:', code.length, 'is digits:', /^\d{6}$/.test(code));
        return fail(400, { error: 'Please enter a valid 6-digit code' });
      }

      // Verify the code
      console.log('Verifying password change code:', { code, email });
      console.log('Code type:', typeof code, 'Code length:', code.length);
      console.log('Email type:', typeof email, 'Email:', email);
      
      const isValid = await TokenService.validatePasswordChangeCode(code, email);
      console.log('Password change code validation result:', isValid);
      
      if (!isValid) {
        console.log('Password change code validation failed');
        return fail(400, { error: 'Invalid or expired verification code' });
      }

      // Consume the code (delete it)
      const consumed = await TokenService.consumePasswordChangeCode(code, email);
      
      if (!consumed) {
        return fail(400, { error: 'Failed to verify code' });
      }

      return {
        success: true,
        message: 'Code verified successfully!'
      };
    } catch (error) {
      console.error('Password change code verification error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  }
};
