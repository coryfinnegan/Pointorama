import { vi, describe, it, expect } from "vitest";

// server-only is globally mocked in setup.ts, but we re-declare here for clarity
vi.mock("server-only", () => ({}));

import { createSessionToken, verifySessionToken } from "@/lib/session";

describe("session JWT", () => {
  it("createSessionToken returns a three-part JWT string", async () => {
    const token = await createSessionToken();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifySessionToken returns true for a freshly created token", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("verifySessionToken returns false for an empty string", async () => {
    expect(await verifySessionToken("")).toBe(false);
  });

  it("verifySessionToken returns false for arbitrary garbage", async () => {
    expect(await verifySessionToken("not.a.jwt")).toBe(false);
  });

  it("verifySessionToken returns false for a token signed with a different secret", async () => {
    // Manually construct a token signed with wrong secret
    const { SignJWT } = await import("jose");
    const wrongSecret = new TextEncoder().encode("wrong-secret-totally-different!!");
    const badToken = await new SignJWT({ admin: true })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(wrongSecret);
    expect(await verifySessionToken(badToken)).toBe(false);
  });
});
