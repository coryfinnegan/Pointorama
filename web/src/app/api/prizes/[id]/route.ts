import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { prizes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const [updated] = await db
    .update(prizes)
    .set(body)
    .where(eq(prizes.id, Number(id)))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  await db
    .update(prizes)
    .set({ active: false })
    .where(eq(prizes.id, Number(id)));
  return NextResponse.json({ ok: true });
}
