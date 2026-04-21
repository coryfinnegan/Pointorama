import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/db";
import { allowanceSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assertAdmin } from "@/lib/session";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  let [row] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));

  // Auto-generate on first request
  if (!row.quickAddToken) {
    const token = randomBytes(24).toString("base64url");
    [row] = await db
      .update(allowanceSettings)
      .set({ quickAddToken: token })
      .where(eq(allowanceSettings.id, 1))
      .returning();
  }

  return NextResponse.json({ token: row.quickAddToken });
}

export async function POST() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = randomBytes(24).toString("base64url");
  const db = getDb();
  await db
    .update(allowanceSettings)
    .set({ quickAddToken: token })
    .where(eq(allowanceSettings.id, 1));

  return NextResponse.json({ token });
}
