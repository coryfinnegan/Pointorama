import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const assertAdmin = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/session", () => ({ assertAdmin: () => assertAdmin() }));

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/create-test-db");
  const db = createTestDb();
  return { getDb: () => db };
});

const { getDb } = await import("@/db");
const { moneyLog } = await import("@/db/schema");
const { GET, POST } = await import("@/app/api/money/route");

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/money", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function balance() {
  return (await (await GET()).json()).totalCents as number;
}

describe("/api/money", () => {
  beforeEach(async () => {
    assertAdmin.mockResolvedValue(undefined);
    await getDb().delete(moneyLog);
  });

  it("starts at a zero balance", async () => {
    expect(await balance()).toBe(0);
  });

  it("adds money", async () => {
    const res = await POST(postJson({ amountCents: 500, note: "Bonus" }));
    expect(res.status).toBe(201);
    expect(await balance()).toBe(500);
  });

  it("subtracts money from the balance", async () => {
    await POST(postJson({ amountCents: 1000, note: "Allowance" }));
    const res = await POST(postJson({ amountCents: -350, note: "Candy" }));
    expect(res.status).toBe(201);
    const entry = await res.json();
    expect(entry.amountCents).toBe(-350);
    expect(entry.note).toBe("Candy");
    expect(await balance()).toBe(650);
  });

  it("allows subtracting the entire balance", async () => {
    await POST(postJson({ amountCents: 200 }));
    const res = await POST(postJson({ amountCents: -200 }));
    expect(res.status).toBe(201);
    expect(await balance()).toBe(0);
  });

  it("rejects subtracting more than the balance", async () => {
    await POST(postJson({ amountCents: 300 }));
    const res = await POST(postJson({ amountCents: -301 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Insufficient balance");
    expect(body.balanceCents).toBe(300);
    expect(await balance()).toBe(300);
  });

  it("rejects zero and fractional-cent amounts", async () => {
    expect((await POST(postJson({ amountCents: 0 }))).status).toBe(400);
    expect((await POST(postJson({ amountCents: -1.5 }))).status).toBe(400);
    expect((await POST(postJson({ amountCents: "5" }))).status).toBe(400);
  });

  it("requires admin to subtract", async () => {
    await POST(postJson({ amountCents: 500 }));
    assertAdmin.mockRejectedValueOnce(new Error("Unauthorized"));
    const res = await POST(postJson({ amountCents: -100 }));
    expect(res.status).toBe(401);
    expect(await balance()).toBe(500);
  });
});
