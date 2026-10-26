import { describe, it, expect, beforeEach } from "vitest";
import {
  checkPinAttempt,
  recordPinFailure,
  clearPinFailures,
  resetRateLimits,
  clientKey,
} from "@/lib/rateLimit";

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("allows attempts until the failure limit is reached", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkPinAttempt("a")).toBe(true);
      recordPinFailure("a");
    }
    expect(checkPinAttempt("a")).toBe(false);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 5; i++) recordPinFailure("a");
    expect(checkPinAttempt("b")).toBe(true);
  });

  it("clears failures after a success", () => {
    for (let i = 0; i < 5; i++) recordPinFailure("a");
    clearPinFailures("a");
    expect(checkPinAttempt("a")).toBe(true);
  });

  it("unblocks after the window expires", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) recordPinFailure("a", t0);
    expect(checkPinAttempt("a", t0 + 1000)).toBe(false);
    expect(checkPinAttempt("a", t0 + 16 * 60 * 1000)).toBe(true);
  });

  it("uses the first x-forwarded-for address as the key", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientKey(req)).toBe("1.2.3.4");
    expect(clientKey(new Request("http://x"))).toBe("unknown");
  });
});
