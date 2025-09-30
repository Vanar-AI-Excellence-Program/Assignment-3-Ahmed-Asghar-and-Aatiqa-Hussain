import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.auth?.user) {
    throw redirect(302, "/login");
  }

  return {
    user: locals.auth.user,
  };
};
