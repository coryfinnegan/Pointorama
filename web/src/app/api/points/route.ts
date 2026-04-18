import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pointsLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const logs = await db.select().from(pointsLog).orderBy(desc(pointsLog.id));
  const total = logs.reduce((sum, entry) => sum + entry.amount, 0);
  return NextResponse.json({ total, logs });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { amount, note } = await req.json();
  if (typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const [entry] = await db
    .insert(pointsLog)
    .values({ amount, note: note ?? "" })
    .returning();
  return NextResponse.json(entry, { status: 201 });
}
