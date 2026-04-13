import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

declare global {
  var __instasightsSql: ReturnType<typeof postgres> | undefined;
  var __instasightsDb:
    | ReturnType<typeof drizzle<typeof schema>>
    | undefined;
}

const connectionString = process.env.DATABASE_URL;

export const isDatabaseConfigured = Boolean(connectionString);

const sqlInstance =
  connectionString === undefined
    ? null
    : (globalThis.__instasightsSql ??=
        postgres(connectionString, {
          prepare: false,
          max: 1,
        }));

export const db =
  sqlInstance === null
    ? null
    : (globalThis.__instasightsDb ??= drizzle(sqlInstance, { schema }));

export function getDb() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return db;
}
