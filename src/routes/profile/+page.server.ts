import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if not authenticated
	if (!locals.auth?.user) {
		throw redirect(302, '/login');
	}

	// Return user data for the page
	return {
		user: locals.auth.user,
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.auth?.user) {
			return {
				error: 'Not authenticated'
			};
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;

		if (!name || !email) {
			return {
				error: 'Name and email are required'
			};
		}

		try {
			// Update user profile
			const { db } = await import('$lib/server/db');
			const { users } = await import('$lib/server/db/schema');
			const { eq } = await import('drizzle-orm');

			await db
				.update(users)
				.set({
					name,
					email,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.auth.user.id));

			return {
				success: 'Profile updated successfully'
			};
		} catch (error) {
			console.error('Profile update error:', error);
			return {
				error: 'Failed to update profile'
			};
		}
	}
};