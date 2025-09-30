import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.auth?.user) {
    throw redirect(302, "/login");
  }

  return {
    user: locals.auth.user,
  };
};
