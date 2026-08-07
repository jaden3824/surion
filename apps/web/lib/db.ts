import "server-only";

import { neon } from "@neondatabase/serverless";

type DatabaseClient = ReturnType<typeof neon>;

let cachedClient: DatabaseClient | null = null;
let cachedUrl: string | null = null;

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || null;
}
export function isDatabaseConfigured() {
  return Boolean(databaseUrl());
}

/**
 * Returns the pooled Neon HTTP client. A missing connection string is handled
 * explicitly so production routes can fail closed instead of writing locally.
 */
export function getDatabase(): DatabaseClient | null {
  const url = databaseUrl();
  if (!url) return null;

  if (!cachedClient || cachedUrl !== url) {
    cachedClient = neon(url);
    cachedUrl = url;
  }

  return cachedClient;
}
