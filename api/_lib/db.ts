import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, max: 1, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
