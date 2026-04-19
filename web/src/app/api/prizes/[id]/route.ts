import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { prizes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assertAdmin } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const { id } = await params;
  const body = await req.json();

  // whitelist updatable fields to prevent mass assignment
  const { name, description, pointCost, imageUrl, active } = body;
  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (description !== undefined) patch.description = description;
  if (pointCost !== undefined) patch.pointCost = pointCost;
  if (imageUrl !== undefined) patch.imageUrl = imageUrl;
  if (active !== undefined) patch.active = active;

  const [updated] = await db
    .update(prizes)
    .set(patch)
    .where(eq(prizes.id, Number(id)))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const { id } = await params;
  await db
    .update(prizes)
    .set({ active: false })
    .where(eq(prizes.id, Number(id)));
  return NextResponse.json({ ok: true });
}
