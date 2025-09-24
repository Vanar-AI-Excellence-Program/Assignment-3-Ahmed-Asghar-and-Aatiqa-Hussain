import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  
  if (!session) {
    throw redirect(302, '/login');
  }
  
  // Check if user is admin
  if (session.user?.role !== 'admin') {
    throw redirect(302, '/');
  }
  
  try {
    // Fetch all users from database
    const allUsers = await db.select().from(users);
    
    return {
      user: session.user,
      users: allUsers
    };
  } catch (error) {
    console.error('Error loading admin data:', error);
    return {
      user: session.user,
      users: []
    };
  }
};
