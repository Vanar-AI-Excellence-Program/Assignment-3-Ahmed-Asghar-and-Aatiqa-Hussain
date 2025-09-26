import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  // Return minimal data for forgot-password page without user data
  return {
    user: null,
    session: null,
  };
};
