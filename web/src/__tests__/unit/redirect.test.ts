import { describe, it, expect } from "vitest";
import { getPostLoginPath } from "@/lib/redirect";

describe("getPostLoginPath", () => {
  it("defaults to /admin when no from param is given", () => {
    expect(getPostLoginPath(null)).toBe("/admin");
    expect(getPostLoginPath(undefined)).toBe("/admin");
    expect(getPostLoginPath("")).toBe("/admin");
  });

  it("keeps admin paths", () => {
    expect(getPostLoginPath("/admin")).toBe("/admin");
    expect(getPostLoginPath("/admin/settings")).toBe("/admin/settings");
    expect(getPostLoginPath("/admin?tab=prizes")).toBe("/admin?tab=prizes");
  });

  it("never sends the user back to the login page", () => {
    expect(getPostLoginPath("/admin/login")).toBe("/admin");
    expect(getPostLoginPath("/admin/login?from=%2Fadmin")).toBe("/admin");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(getPostLoginPath("https://evil.example")).toBe("/admin");
    expect(getPostLoginPath("//evil.example/admin")).toBe("/admin");
    expect(getPostLoginPath("/\evil.example")).toBe("/admin");
  });

  it("rejects non-admin paths", () => {
    expect(getPostLoginPath("/")).toBe("/admin");
    expect(getPostLoginPath("/administrator")).toBe("/admin");
  });
});
