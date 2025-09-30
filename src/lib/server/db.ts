import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(process.env.DATABASE_URL as string);

export const EMBEDDING_API_URL =
  process.env.EMBEDDING_API_URL || "http://localhost:8000";

export const db = drizzle(client, { schema });
