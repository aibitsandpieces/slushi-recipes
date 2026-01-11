import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use postgres-js for better serverless compatibility
const client = postgres(process.env.DATABASE_URL, {
  max: 1, // Single connection for serverless
  prepare: false, // Required for Supabase pooler
});

export const db = drizzle(client, { schema });

// Keep a pg Pool for session storage (connect-pg-simple needs it)
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
