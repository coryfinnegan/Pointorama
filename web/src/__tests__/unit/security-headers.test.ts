import { describe, it, expect } from "vitest";
import nextConfig from "../../../next.config";

describe("next.config security headers", () => {
  it("sends hardening headers on every route and hides X-Powered-By", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/:path*")!;
    const keys = all.headers.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining(["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"])
    );
    expect(all.headers.find((h) => h.key === "X-Frame-Options")?.value).toBe("DENY");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
