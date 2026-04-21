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

export const allowanceSettings = sqliteTable("allowance_settings", {
  id: int("id").primaryKey({ autoIncrement: true }),
  weeklyAmount: int("weekly_amount").notNull().default(0),
  weeklyMoneyCents: int("weekly_money_cents").notNull().default(0),
  exchangeRate: int("exchange_rate").notNull().default(10),
  quickAddToken: text("quick_add_token"),
  enabled: int("enabled", { mode: "boolean" }).notNull().default(false),
  nextPayAt: text("next_pay_at"), // ISO datetime, null until first enable
});

export const moneyLog = sqliteTable("money_log", {
  id: int("id").primaryKey({ autoIncrement: true }),
  amountCents: int("amount_cents").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type PointsLog = typeof pointsLog.$inferSelect;
export type Prize = typeof prizes.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type AllowanceSettings = typeof allowanceSettings.$inferSelect;
export type MoneyLog = typeof moneyLog.$inferSelect;
