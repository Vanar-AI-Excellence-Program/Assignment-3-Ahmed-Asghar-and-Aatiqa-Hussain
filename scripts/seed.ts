import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/lib/server/db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema: { users } });

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Check if admin user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, "admin@shieldauth.com"),
    });

    if (!existingUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin4223", 12);

      await db.insert(users).values({
        id: nanoid(),
        name: "Admin ShieldAuth",
        email: "admin@shieldauth.com",
        password: hashedPassword,
        emailVerified: new Date(),
        role: "admin",
        isActive: true,
      });

      console.log("✅ Admin user created: admin@shieldauth.com / admin4223");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    console.log("🎉 Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
