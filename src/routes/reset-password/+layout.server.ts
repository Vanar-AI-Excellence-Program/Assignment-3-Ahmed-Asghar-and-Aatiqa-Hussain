import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  // Return minimal data for reset-password page without user data
  return {
    user: null,
    session: null,
  };
};
