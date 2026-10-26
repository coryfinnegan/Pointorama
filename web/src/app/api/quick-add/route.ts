import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { pointsLog, allowanceSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkPinAttempt, recordPinFailure, clearPinFailures, clientKey } from "@/lib/rateLimit";

// GET /api/quick-add?token=TOKEN&amount=N&note=... — used by the Siri Shortcut
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";
  const amount = Number(searchParams.get("amount"));
  const note = searchParams.get("note") ?? "";

  if (!amount || isNaN(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const db = getDb();
  const [settings] = await db.select().from(allowanceSettings).where(eq(allowanceSettings.id, 1));
  if (!settings?.quickAddToken || token !== settings.quickAddToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const [entry] = await db.insert(pointsLog).values({ amount, note }).returning();
  return NextResponse.json({ ok: true, amount: entry.amount, note: entry.note });
}

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
    const key = clientKey(req);
    if (!checkPinAttempt(key)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const hashB64 = process.env.ADMIN_PIN_HASH ?? "";
    const hash = Buffer.from(hashB64, "base64").toString("utf8");
    const valid = await bcrypt.compare(body.pin, hash);
    if (!valid) {
      recordPinFailure(key);
      return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
    }
    clearPinFailures(key);
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [entry] = await db
    .insert(pointsLog)
    .values({ amount, note: note ?? "" })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
