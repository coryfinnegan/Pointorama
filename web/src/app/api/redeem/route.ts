import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { pointsLog, prizes, redemptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const db = getDb();
  const { prizeId } = await req.json();
  if (!prizeId) {
    return NextResponse.json({ error: "Missing prizeId" }, { status: 400 });
  }

  const [prize] = await db.select().from(prizes).where(eq(prizes.id, prizeId));
  if (!prize || !prize.active) {
    return NextResponse.json({ error: "Prize not found" }, { status: 404 });
  }

  const logs = await db.select().from(pointsLog);
  const totalPoints = logs.reduce((sum, e) => sum + e.amount, 0);

  const redeemedList = await db
    .select()
    .from(redemptions)
    .where(sql`status != 'cancelled'`);
  const spentPoints = redeemedList.reduce((sum, r) => sum + r.pointsSpent, 0);
  const available = totalPoints - spentPoints;

  if (available < prize.pointCost) {
    return NextResponse.json({ error: "Not enough points" }, { status: 400 });
  }

  const [redemption] = await db
    .insert(redemptions)
    .values({
      prizeId: prize.id,
      prizeName: prize.name,
      pointsSpent: prize.pointCost,
    })
    .returning();

  return NextResponse.json(redemption, { status: 201 });
}
