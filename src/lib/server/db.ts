import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema.js";
import { env } from "$env/dynamic/private";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(env.DATABASE_URL);

export const EMBEDDING_API_URL =
  env.EMBEDDING_API_URL || "http://localhost:8000";

export const db = drizzle(client, { schema });
