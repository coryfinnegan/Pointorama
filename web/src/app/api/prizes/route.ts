import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { prizes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const all = await db
    .select()
    .from(prizes)
    .where(eq(prizes.active, true))
    .orderBy(asc(prizes.pointCost));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, description, pointCost, imageUrl } = await req.json();
  if (!name || typeof pointCost !== "number" || pointCost < 1) {
    return NextResponse.json({ error: "Invalid prize data" }, { status: 400 });
  }
  const [prize] = await db
    .insert(prizes)
    .values({ name, description: description ?? "", pointCost, imageUrl })
    .returning();
  return NextResponse.json(prize, { status: 201 });
}
