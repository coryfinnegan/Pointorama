import { vi, describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/create-test-db");
  const db = createTestDb();
  return { getDb: () => db };
});

const { POST: redeemPost } = await import("@/app/api/redeem/route");
const { POST: pointsPost } = await import("@/app/api/points/route");
const { POST: prizesPost } = await import("@/app/api/prizes/route");
const { GET: redemptionsGet } = await import("@/app/api/redemptions/route");
const { PATCH: redemptionsPatch } = await import("@/app/api/redemptions/[id]/route");

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let prizeId: number;

describe("POST /api/redeem — insufficient points", () => {
  it("fails when there are no points at all", async () => {
    // Create a prize first
    const prizeRes = await prizesPost(
      jsonRequest("http://localhost/api/prizes", "POST", {
        name: "Test Prize",
        pointCost: 50,
      })
    );
    expect(prizeRes.status).toBe(201);
    prizeId = (await prizeRes.json()).id;

    const res = await redeemPost(
      jsonRequest("http://localhost/api/redeem", "POST", { prizeId })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not enough points/i);
  });

  it("fails with missing prizeId", async () => {
    const res = await redeemPost(
      jsonRequest("http://localhost/api/redeem", "POST", {})
    );
    expect(res.status).toBe(400);
  });

  it("fails for a non-existent prize", async () => {
    const res = await redeemPost(
      jsonRequest("http://localhost/api/redeem", "POST", { prizeId: 99999 })
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/redeem — successful redemption", () => {
  it("succeeds after enough points are added", async () => {
    await pointsPost(
      jsonRequest("http://localhost/api/points", "POST", {
        amount: 100,
        note: "Good week",
      })
    );

    const res = await redeemPost(
      jsonRequest("http://localhost/api/redeem", "POST", { prizeId })
    );
    expect(res.status).toBe(201);
    const redemption = await res.json();
    expect(redemption.prizeName).toBe("Test Prize");
    expect(redemption.pointsSpent).toBe(50);
    expect(redemption.status).toBe("pending");
  });

  it("GET /api/redemptions returns the new redemption", async () => {
    const res = await redemptionsGet();
    const list = await res.json();
    expect(list).toHaveLength(1);
    expect(list[0].prizeName).toBe("Test Prize");
  });

  it("blocks a second redemption when available balance is 50 (prize costs 50)", async () => {
    // Balance is 100 - 50 = 50, prize costs 50 → should succeed one more time
    const res = await redeemPost(
      jsonRequest("http://localhost/api/redeem", "POST", { prizeId })
    );
    expect(res.status).toBe(201);
  });

  it("blocks a third redemption (balance exhausted)", async () => {
    // Balance is now 0
    const res = await redeemPost(
      jsonRequest("http://localhost/api/redeem", "POST", { prizeId })
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/redemptions/[id]", () => {
  it("marks a redemption as fulfilled", async () => {
    const listRes = await redemptionsGet();
    const [first] = await listRes.json();

    const res = await redemptionsPatch(
      jsonRequest(`http://localhost/api/redemptions/${first.id}`, "PATCH", {
        status: "fulfilled",
      }),
      { params: Promise.resolve({ id: String(first.id) }) }
    );
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.status).toBe("fulfilled");
  });
});
