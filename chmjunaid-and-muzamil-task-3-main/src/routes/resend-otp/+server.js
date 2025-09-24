import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import { generateOTP, generateOTPExpiry } from '$lib/utils.js';
import { sendOTPEmail } from '$lib/email.js';

export async function POST({ request }) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return json({ error: 'User ID is required.' }, { status: 400 });
    }
    
    // Find user
    const user = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    
    if (user.length === 0) {
      return json({ error: 'User not found.' }, { status: 400 });
    }
    
    const userData = user[0];
    
    // Check if email is already verified
    if (userData.emailVerified) {
      return json({ error: 'Email is already verified.' }, { status: 400 });
    }
    
    // Generate new OTP and expiry
    const newOtp = generateOTP();
    const newOtpExpiry = generateOTPExpiry();
    
    // Update user with new OTP
    await db.update(users)
      .set({
        otp: newOtp,
        otpExpiry: newOtpExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, parseInt(userId)));
    
    // Send new OTP email
    try {
      await sendOTPEmail(userData.email, newOtp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return json({ error: 'Failed to send OTP email. Please try again.' }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'New OTP sent successfully!'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return json({ error: 'Failed to resend OTP. Please try again.' }, { status: 500 });
  }
}

