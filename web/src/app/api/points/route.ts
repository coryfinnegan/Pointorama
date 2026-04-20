import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pointsLog, allowanceSettings, moneyLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { assertAdmin } from "@/lib/session";

async function applyPendingAllowance() {
  const db = getDb();
  const [al] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));
  if (!al || !al.enabled || !al.weeklyAmount || !al.nextPayAt) return;

  const now = Date.now();
  const next = new Date(al.nextPayAt).getTime();
  if (now < next) return;

  // Calculate how many full weeks are overdue (catch up if app was offline)
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeksMissed = Math.max(1, Math.floor((now - next) / weekMs) + 1);
  const totalPoints = weeksMissed * al.weeklyAmount;

  if (al.weeklyAmount > 0) {
    await db.insert(pointsLog).values({
      amount: totalPoints,
      note: weeksMissed > 1
        ? `💰 Allowance ×${weeksMissed} weeks (+${al.weeklyAmount}/wk)`
        : `💰 Weekly allowance`,
    });
  }

  if (al.weeklyMoneyCents > 0) {
    const totalMoney = weeksMissed * al.weeklyMoneyCents;
    await db.insert(moneyLog).values({
      amountCents: totalMoney,
      note: weeksMissed > 1
        ? `💵 Allowance ×${weeksMissed} weeks (+$${(al.weeklyMoneyCents / 100).toFixed(2)}/wk)`
        : `💵 Weekly allowance`,
    });
  }

  // Advance nextPayAt by exactly the number of weeks paid
  const newNext = new Date(next + weeksMissed * weekMs);
  await db
    .update(allowanceSettings)
    .set({ nextPayAt: newNext.toISOString() })
    .where(eq(allowanceSettings.id, 1));
}

export async function GET() {
  await applyPendingAllowance();

  const db = getDb();
  const logs = await db.select().from(pointsLog).orderBy(desc(pointsLog.id));
  const total = logs.reduce((sum, entry) => sum + entry.amount, 0);

  const [al] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));

  return NextResponse.json({ total, logs, allowance: al });
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
