import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { DATABASE_FILENAME } from "./env";

let db: Awaited<ReturnType<typeof open>> | null = null;

export const openDb = async () => {
  if (db) return db;

  db = await open({
    filename: DATABASE_FILENAME,
    driver: sqlite3.Database,
  });

  return db;
};

export const initializeDb = async () => {
  const db = await openDb();

  // Run migrations
  await db.migrate({
    migrationsPath: path.join(__dirname, "..", "migrations"),
    force: false,
  });

  return db;
};

// Initialize the database when this module is imported
initializeDb().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
