import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import { generateOTP, generateOTPExpiry } from '$lib/utils.js';
import { sendOTPEmail } from '$lib/email.js';

export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ error: 'Email is required.' }, { status: 400 });
    }
    
    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      return json({ error: 'User not found with this email address.' }, { status: 400 });
    }
    
    const userData = user[0];
    
    // Check if email is already verified
    if (userData.emailVerified) {
      return json({ error: 'Email is already verified. You can log in directly.' }, { status: 400 });
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
      .where(eq(users.id, userData.id));
    
    // Send OTP email
    try {
      await sendOTPEmail(email, newOtp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return json({ error: 'Failed to send OTP email. Please try again.' }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'OTP sent successfully!',
      userId: userData.id
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    return json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}

