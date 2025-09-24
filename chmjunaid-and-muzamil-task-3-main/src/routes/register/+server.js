import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendOTPEmail, sendWelcomeEmail } from '$lib/email.js';
import { generateOTP, generateOTPExpiry } from '$lib/utils.js';

export async function POST({ request }) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return json({ error: 'All fields are required.' }, { status: 400 });
    }
    
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return json({ error: 'Email already registered.' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();
    const now = new Date(); // Current timestamp
    
    // Create user with OTP (always as 'user' role)
    const [user] = await db.insert(users).values({ 
      name, 
      email, 
      password: hashedPassword,
      role: 'user', // Always set as user role
      otp,
      otpExpiry,
      emailVerified: false,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (welcomeEmailError) {
      console.error('Failed to send welcome email:', welcomeEmailError);
      // Don't fail registration if welcome email fails
    }
    
    return json({ 
      success: true,
      message: 'Account created successfully! Please check your email for the verification OTP.',
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
} 