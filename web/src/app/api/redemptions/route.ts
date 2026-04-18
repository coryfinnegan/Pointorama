import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { redemptions } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const all = await db
    .select()
    .from(redemptions)
    .orderBy(desc(redemptions.id));
  return NextResponse.json(all);
}
