import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users, sessions } from '$lib/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return json({ error: 'Email and password are required.' }, { status: 400 });
    }
    
    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).then(res => res[0]);
    if (!user) {
      return json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    
    // Require email verification for credentials sign-in
    if (!user.emailVerified) {
      return json({ error: 'Please verify your email before signing in.' }, { status: 401 });
    }
    
    // Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    
    // Create session in database
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.insert(sessions).values({
      sessionToken,
      userId: user.id,
      expires,
      data: { provider: 'credentials' }
    });
    
    // Set session cookie
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token';
      
    cookies.set(cookieName, sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });
    
    console.log(`[CustomAuth] Created database session for user ${user.email}: ${sessionToken}`);
    
    return json({ 
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Credentials login error:', error);
    return json({ error: 'Sign in failed. Please try again.' }, { status: 500 });
  }
}
