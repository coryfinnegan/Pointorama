import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

let _db: BetterSQLite3Database<typeof schema> | null = null;

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pointorama.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS prizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      point_cost INTEGER NOT NULL,
      image_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize_id INTEGER NOT NULL REFERENCES prizes(id),
      prize_name TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      redeemed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS allowance_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekly_amount INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 0,
      next_pay_at TEXT
    );
    -- Seed the single settings row if missing
    INSERT OR IGNORE INTO allowance_settings (id, weekly_amount, enabled) VALUES (1, 0, 0);
  `);

  _db = drizzle(sqlite, { schema });
  return _db;
}
