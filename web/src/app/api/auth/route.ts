import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME, EXPIRY_SECONDS } from "@/lib/session";

export async function POST(req: Request) {
  const { pin } = await req.json();
  if (typeof pin !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PIN_HASH ?? "";
  const valid = await bcrypt.compare(pin, hash);
  if (!valid) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRY_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
