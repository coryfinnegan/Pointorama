import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { moneyLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { assertAdmin } from "@/lib/session";

export async function GET() {
  const db = getDb();
  const logs = await db.select().from(moneyLog).orderBy(desc(moneyLog.id));
  const totalCents = logs.reduce((s, l) => s + l.amountCents, 0);
  return NextResponse.json({ totalCents, logs });
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const { amountCents, note } = await req.json();
  if (typeof amountCents !== "number" || amountCents === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const [entry] = await db
    .insert(moneyLog)
    .values({ amountCents, note: note ?? "" })
    .returning();
  return NextResponse.json(entry, { status: 201 });
}
