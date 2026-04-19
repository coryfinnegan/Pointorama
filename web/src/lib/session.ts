import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE_NAME = "admin_session";
const EXPIRY_SECONDS = 60 * 60 * 8; // 8 hours

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRY_SECONDS}s`)
    .setIssuedAt()
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/** Throws if the request has no valid admin session cookie. */
export async function assertAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  await jwtVerify(token, secret);
}

export { COOKIE_NAME, EXPIRY_SECONDS };
