"use client";
import { useEffect, useState } from "react";
import type { PointsLog, Redemption } from "@/db/schema";

type Entry =
  | { kind: "earn"; id: number; label: string; amount: number; date: string }
  | { kind: "spend"; id: number; label: string; amount: number; date: string; status: string };

export default function LogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/points").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
    ]).then(([pts, reds]: [{ total: number; logs: PointsLog[] }, Redemption[]]) => {
      setTotalEarned(pts.total);
      const spent = reds.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.pointsSpent, 0);
      setTotalSpent(spent);

      const earnEntries: Entry[] = pts.logs.map((l) => ({
        kind: "earn",
        id: l.id,
        label: l.note || "Points added",
        amount: l.amount,
        date: new Date(l.createdAt + "Z").toLocaleDateString(),
      }));
      const spendEntries: Entry[] = reds.map((r) => ({
        kind: "spend",
        id: r.id,
        label: r.prizeName,
        amount: r.pointsSpent,
        date: new Date(r.redeemedAt + "Z").toLocaleDateString(),
        status: r.status,
      }));
      setEntries([...earnEntries, ...spendEntries]);
    });
  }, []);

  return (
    <div className="game-screen">
      <div style={{ paddingTop: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: "var(--gold)", marginBottom: 16 }}>
          📜 POINT LOG
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div className="pcard pcard-green" style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginBottom: 10 }}>TOTAL EARNED</div>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 28, color: "var(--green)" }}>{totalEarned.toLocaleString()}</div>
          </div>
          <div className="pcard pcard-red" style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginBottom: 10 }}>TOTAL SPENT</div>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 28, color: "var(--red)" }}>{totalSpent.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", paddingTop: 60, lineHeight: 3 }}>
          NO HISTORY YET!<br />GET EARNING!
        </div>
      ) : (
        entries.map((h, i) => (
          <div key={`${h.kind}-${h.id}`} className="pcard" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", marginBottom: 8 }}>
            <div style={{ fontSize: 28, width: 40, textAlign: "center" }}>{h.kind === "earn" ? "⭐" : "🛍️"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{h.label}</div>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginTop: 5 }}>{h.date}</div>
              {h.kind === "spend" && (
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: h.status === "fulfilled" ? "var(--green)" : h.status === "cancelled" ? "var(--dim)" : "var(--gold)", marginTop: 3 }}>
                  {h.status.toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: h.kind === "earn" ? "var(--green)" : "var(--red)", minWidth: 60, textAlign: "right" }}>
              {h.kind === "earn" ? "+" : "-"}{h.amount}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
