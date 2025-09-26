import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ cookies }) => {
	// Get session token from cookie
	const cookieName = process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';
	const sessionToken = cookies.get(cookieName);
	
	if (sessionToken) {
		// Delete session from database
		await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
		
		// Clear session cookie
		cookies.delete(cookieName, { path: '/' });
	}
	
	// Redirect to home page
	throw redirect(303, '/');
};
