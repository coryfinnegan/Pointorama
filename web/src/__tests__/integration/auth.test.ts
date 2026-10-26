import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// server-only is mocked globally in setup.ts
// Mock next/headers so the route can set cookies without a real server context
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

const { POST } = await import("@/app/api/auth/route");
const { resetRateLimits } = await import("@/lib/rateLimit");

function authRequest(body: unknown, ip?: string) {
  return new NextRequest("http://localhost/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(ip ? { "x-forwarded-for": ip } : {}) },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockCookieSet.mockClear();
  resetRateLimits();
});

describe("POST /api/auth", () => {
  it("returns 401 for a wrong PIN", async () => {
    const res = await POST(authRequest({ pin: "0000" }));
    expect(res.status).toBe(401);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-string pin field", async () => {
    const res = await POST(authRequest({ pin: 1234 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when pin field is missing", async () => {
    const res = await POST(authRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 200 and sets admin_session cookie for the correct PIN", async () => {
    const res = await POST(authRequest({ pin: "1234" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify a cookie was set with the right name
    expect(mockCookieSet).toHaveBeenCalledOnce();
    const [cookieName, cookieValue, cookieOptions] = mockCookieSet.mock.calls[0];
    expect(cookieName).toBe("admin_session");
    expect(typeof cookieValue).toBe("string");
    expect(cookieValue.split(".")).toHaveLength(3); // valid JWT
    expect(cookieOptions.httpOnly).toBe(true);
  });

  it("the cookie value is a valid JWT verifiable with the session module", async () => {
    await POST(authRequest({ pin: "1234" }));
    const [, token] = mockCookieSet.mock.calls[0];
    const { verifySessionToken } = await import("@/lib/session");
    expect(await verifySessionToken(token)).toBe(true);
  });
});

describe("POST /api/auth rate limiting", () => {
  it("returns 429 after 5 wrong PINs, even for the correct PIN", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await POST(authRequest({ pin: "0000" }, "9.9.9.9"))).status).toBe(401);
    }
    expect((await POST(authRequest({ pin: "1234" }, "9.9.9.9"))).status).toBe(429);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("does not block a different client", async () => {
    for (let i = 0; i < 5; i++) await POST(authRequest({ pin: "0000" }, "9.9.9.9"));
    expect((await POST(authRequest({ pin: "1234" }, "8.8.8.8"))).status).toBe(200);
  });

  it("a successful login resets the failure count", async () => {
    for (let i = 0; i < 4; i++) await POST(authRequest({ pin: "0000" }, "7.7.7.7"));
    expect((await POST(authRequest({ pin: "1234" }, "7.7.7.7"))).status).toBe(200);
    for (let i = 0; i < 4; i++) {
      expect((await POST(authRequest({ pin: "0000" }, "7.7.7.7"))).status).toBe(401);
    }
  });
});
