import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  // Return user data if authenticated, null if not
  return {
    user: locals.auth?.user || null,
    session: locals.auth || null,
  };
};
