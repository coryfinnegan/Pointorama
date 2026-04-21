import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { pointsLog, allowanceSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amount, note } = body;

  if (typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Auth: Bearer token (Siri) or PIN (web)
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const db = getDb();
  const [settings] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));

  if (bearerToken) {
    if (!settings?.quickAddToken || bearerToken !== settings.quickAddToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } else if (typeof body.pin === "string") {
    const hashB64 = process.env.ADMIN_PIN_HASH ?? "";
    const hash = Buffer.from(hashB64, "base64").toString("utf8");
    const valid = await bcrypt.compare(body.pin, hash);
    if (!valid) {
      return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
    }
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [entry] = await db
    .insert(pointsLog)
    .values({ amount, note: note ?? "" })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
