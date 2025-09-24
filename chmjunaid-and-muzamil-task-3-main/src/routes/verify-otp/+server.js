import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq, and } from 'drizzle-orm';
import { isOTPExpired } from '$lib/utils.js';

export async function POST({ request }) {
  try {
    const { otp, userId } = await request.json();
    
    if (!otp || !userId) {
      return json({ error: 'OTP and user ID are required.' }, { status: 400 });
    }
    
    // Find user with matching OTP
    const user = await db.select().from(users).where(
      and(
        eq(users.id, parseInt(userId)),
        eq(users.otp, otp)
      )
    ).limit(1);
    
    if (user.length === 0) {
      return json({ error: 'Invalid OTP or user ID.' }, { status: 400 });
    }
    
    const userData = user[0];
    
    // Check if OTP is expired
    if (isOTPExpired(userData.otpExpiry)) {
      return json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }
    
    // Update user: mark email as verified and clear OTP
    await db.update(users)
      .set({
        emailVerified: true,
        otp: null,
        otpExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, parseInt(userId)));
    
    return json({ 
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}

