import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  // Return user data if authenticated, null if not
  return {
    user: locals.auth?.user || null,
    session: locals.auth || null,
  };
};
