import { vi, describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/create-test-db");
  const db = createTestDb();
  return { getDb: () => db };
});

const { GET, POST } = await import("@/app/api/prizes/route");
const { DELETE, PATCH } = await import("@/app/api/prizes/[id]/route");

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/prizes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function idParams(id: number) {
  return { params: Promise.resolve({ id: String(id) }) };
}

describe("GET /api/prizes", () => {
  it("returns an empty array on a fresh database", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe("POST /api/prizes", () => {
  it("rejects a missing name", async () => {
    const res = await POST(postJson({ pointCost: 10 }));
    expect(res.status).toBe(400);
  });

  it("rejects pointCost < 1", async () => {
    const res = await POST(postJson({ name: "Test", pointCost: 0 }));
    expect(res.status).toBe(400);
  });

  it("creates a prize with all fields and returns 201", async () => {
    const res = await POST(
      postJson({ name: "Minecraft DLC", description: "Fun pack", pointCost: 100 })
    );
    expect(res.status).toBe(201);
    const prize = await res.json();
    expect(prize.name).toBe("Minecraft DLC");
    expect(prize.pointCost).toBe(100);
    expect(prize.active).toBe(true);
  });

  it("creates a second prize", async () => {
    const res = await POST(postJson({ name: "Roblox Credits", pointCost: 50 }));
    expect(res.status).toBe(201);
  });
});

describe("GET /api/prizes after inserts", () => {
  it("returns active prizes sorted by point_cost ascending", async () => {
    const res = await GET();
    const prizes = await res.json();
    expect(prizes).toHaveLength(2);
    expect(prizes[0].pointCost).toBe(50);
    expect(prizes[1].pointCost).toBe(100);
  });
});

describe("DELETE /api/prizes/[id]", () => {
  it("soft-deletes a prize (sets active = false)", async () => {
    const allRes = await GET();
    const prizes = await allRes.json();
    const target = prizes[0];

    const delRes = await DELETE(
      new NextRequest(`http://localhost/api/prizes/${target.id}`, { method: "DELETE" }),
      idParams(target.id)
    );
    expect(delRes.status).toBe(200);

    const afterRes = await GET();
    const remaining = await afterRes.json();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).not.toBe(target.id);
  });
});

describe("PATCH /api/prizes/[id]", () => {
  it("updates prize fields", async () => {
    const allRes = await GET();
    const [prize] = await allRes.json();

    const patchRes = await PATCH(
      new NextRequest(`http://localhost/api/prizes/${prize.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name", pointCost: 200 }),
      }),
      idParams(prize.id)
    );
    expect(patchRes.status).toBe(200);
    const updated = await patchRes.json();
    expect(updated.name).toBe("Updated Name");
    expect(updated.pointCost).toBe(200);
  });
});
