import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if not authenticated
  if (!locals.auth?.user) {
    throw redirect(302, "/login");
  }

  // Return user data for the page
  return {
    user: locals.auth.user,
    session: locals.auth,
  };
};
