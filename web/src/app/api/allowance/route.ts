import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { allowanceSettings, moneyLog, pointsLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { assertAdmin } from "@/lib/session";

export async function GET() {
  const db = getDb();
  const [row] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));
  const moneyLogs = await db.select().from(moneyLog).orderBy(desc(moneyLog.id));
  const moneyTotalCents = moneyLogs.reduce((s, l) => s + l.amountCents, 0);
  return NextResponse.json({ ...row, moneyTotalCents, moneyLogs });
}

export async function PATCH(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (typeof body.weeklyAmount === "number" && body.weeklyAmount >= 0) {
    patch.weeklyAmount = body.weeklyAmount;
  }
  if (typeof body.weeklyMoneyCents === "number" && body.weeklyMoneyCents >= 0) {
    patch.weeklyMoneyCents = body.weeklyMoneyCents;
  }
  if (typeof body.enabled === "boolean") {
    patch.enabled = body.enabled;
    // When enabling, set nextPayAt to 7 days from now if not already set
    if (body.enabled) {
      const [current] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));
      if (!current.nextPayAt) {
        const next = new Date();
        next.setDate(next.getDate() + 7);
        patch.nextPayAt = next.toISOString();
      }
    }
  }
  // Allow directly setting nextPayAt (for admin resets)
  if (body.resetNextPayAt === true) {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    patch.nextPayAt = next.toISOString();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(allowanceSettings)
    .set(patch)
    .where(eq(allowanceSettings.id, 1))
    .returning();

  return NextResponse.json(updated);
}
