import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { redemptions } from "@/db/schema";
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
  const { status } = await req.json();
  const [updated] = await db
    .update(redemptions)
    .set({ status })
    .where(eq(redemptions.id, Number(id)))
    .returning();
  return NextResponse.json(updated);
}
