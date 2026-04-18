import { int, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const pointsLog = sqliteTable("points_log", {
  id: int("id").primaryKey({ autoIncrement: true }),
  amount: int("amount").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const prizes = sqliteTable("prizes", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pointCost: int("point_cost").notNull(),
  imageUrl: text("image_url"),
  active: int("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const redemptions = sqliteTable("redemptions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  prizeId: int("prize_id")
    .notNull()
    .references(() => prizes.id),
  prizeName: text("prize_name").notNull(),
  pointsSpent: int("points_spent").notNull(),
  status: text("status").notNull().default("pending"),
  redeemedAt: text("redeemed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type PointsLog = typeof pointsLog.$inferSelect;
export type Prize = typeof prizes.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
