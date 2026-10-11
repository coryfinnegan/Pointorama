// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const push = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const hardNavigate = vi.fn();
vi.mock("@/lib/redirect", async (orig) => ({
  ...(await orig<typeof import("@/lib/redirect")>()),
  hardNavigate: (path: string) => hardNavigate(path),
}));

const { default: AdminLoginPage } = await import("@/app/admin/login/page");

function submitPin(pin: string) {
  fireEvent.change(screen.getByPlaceholderText("Enter PIN"), { target: { value: pin } });
  fireEvent.click(screen.getByRole("button", { name: "UNLOCK" }));
}

describe("Admin login page", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    push.mockReset();
    hardNavigate.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does a full navigation to /admin after a correct PIN (not a client-side push)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    render(<AdminLoginPage />);
    submitPin("1234");
    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/admin"));
    expect(push).not.toHaveBeenCalled();
  });

  it("returns to the requested admin path from the ?from param", async () => {
    searchParams = new URLSearchParams({ from: "/admin/settings" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    render(<AdminLoginPage />);
    submitPin("1234");
    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/admin/settings"));
  });

  it("ignores an external ?from URL", async () => {
    searchParams = new URLSearchParams({ from: "https://evil.example" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    render(<AdminLoginPage />);
    submitPin("1234");
    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/admin"));
  });

  it("shows an error and stays put on a wrong PIN", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    render(<AdminLoginPage />);
    submitPin("0000");
    expect(await screen.findByText("WRONG PIN!")).toBeTruthy();
    expect(hardNavigate).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
