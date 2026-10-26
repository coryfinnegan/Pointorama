import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkPinAttempt, recordPinFailure, clearPinFailures, clientKey } from "@/lib/rateLimit";
import { createSessionToken, COOKIE_NAME, EXPIRY_SECONDS } from "@/lib/session";

export async function POST(req: Request) {
  const { pin } = await req.json();
  if (typeof pin !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const key = clientKey(req);
  if (!checkPinAttempt(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const hashB64 = process.env.ADMIN_PIN_HASH ?? "";
  const hash = Buffer.from(hashB64, "base64").toString("utf8");
  const valid = await bcrypt.compare(pin, hash);
  if (!valid) {
    recordPinFailure(key);
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  clearPinFailures(key);
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRY_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
