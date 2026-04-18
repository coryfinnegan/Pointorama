import { vi, describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/create-test-db");
  const db = createTestDb();
  return { getDb: () => db };
});

const { GET, POST } = await import("@/app/api/points/route");

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/points", () => {
  it("returns total 0 and empty logs on a fresh database", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(0);
    expect(data.logs).toEqual([]);
  });
});

describe("POST /api/points", () => {
  it("rejects a zero amount", async () => {
    const res = await POST(postJson({ amount: 0 }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric amount", async () => {
    const res = await POST(postJson({ amount: "ten" }));
    expect(res.status).toBe(400);
  });

  it("creates a positive points entry and returns 201", async () => {
    const res = await POST(postJson({ amount: 50, note: "Great homework!" }));
    expect(res.status).toBe(201);
    const entry = await res.json();
    expect(entry.amount).toBe(50);
    expect(entry.note).toBe("Great homework!");
    expect(entry.id).toBeTypeOf("number");
  });

  it("creates a negative (deduction) entry", async () => {
    const res = await POST(postJson({ amount: -10, note: "Lost toy" }));
    expect(res.status).toBe(201);
    const entry = await res.json();
    expect(entry.amount).toBe(-10);
  });
});

describe("GET /api/points after inserts", () => {
  it("reflects accumulated total (50 - 10 = 40)", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.total).toBe(40);
    expect(data.logs).toHaveLength(2);
  });

  it("returns logs in descending order (most recent first)", async () => {
    const res = await GET();
    const { logs } = await res.json();
    expect(logs[0].amount).toBe(-10);
    expect(logs[1].amount).toBe(50);
  });
});
