import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db.js";
import { users, sessions } from "$lib/server/db/schema.js";
import { count, desc, eq, gte, sql } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated and is admin
  if (!locals.auth?.user) {
    throw redirect(302, "/login");
  }

  if (locals.auth.user.role !== "admin") {
    throw redirect(302, "/");
  }

  try {
    // Get user statistics
    const totalUsers = await db.select({ count: count() }).from(users);

    const adminUsers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    // Get recent users (last 10)
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    // Get user registration stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    return {
      user: locals.auth.user,
      stats: {
        totalUsers: totalUsers[0].count,
        adminUsers: adminUsers[0].count,
        recentRegistrations: recentRegistrations[0].count,
      },
      recentUsers,
    };
  } catch (error) {
    console.error("Admin dashboard error:", error);
    throw redirect(302, "/");
  }
};
