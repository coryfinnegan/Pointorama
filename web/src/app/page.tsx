"use client";
import { useEffect, useRef, useState } from "react";
import { getLevel } from "@/lib/levels";
import type { PointsLog, Redemption } from "@/db/schema";

type PointsData = { total: number; logs: PointsLog[] };

const KID_NAME = process.env.NEXT_PUBLIC_KID_NAME ?? "SAM";

function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return display;
}

export default function HomePage() {
  const [data, setData] = useState<PointsData | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/points").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
    ]).then(([pts, red]) => { setData(pts); setRedemptions(red); });
  }, []);

  const spent = redemptions.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.pointsSpent, 0);
  const totalEarned = data?.total ?? 0;
  const available = totalEarned - spent;
  const { level, next, progressPct } = getLevel(totalEarned);

  const displayPts = useCountUp(available);
  const displayTotal = useCountUp(totalEarned);

  const allActivity = [
    ...(data?.logs ?? []).map((l) => ({
      type: "earn" as const,
      label: l.note || "Points added",
      amount: l.amount,
      date: new Date(l.createdAt + "Z").toLocaleDateString(),
    })),
    ...redemptions.map((r) => ({
      type: "spend" as const,
      label: r.prizeName,
      amount: r.pointsSpent,
      date: new Date(r.redeemedAt + "Z").toLocaleDateString(),
    })),
  ].slice(0, 8);

  return (
    <div className="game-screen">
      {/* Player header */}
      <div style={{ textAlign: "center", paddingTop: 28, paddingBottom: 14 }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 11, color: "var(--dim)", letterSpacing: 4, marginBottom: 14 }}>
          PLAYER 1
        </div>
        <div
          className="anim-float"
          style={{ fontFamily: "var(--pixel)", fontSize: 32, color: level.color, textShadow: `0 0 20px ${level.color}, 0 0 40px ${level.color}55`, marginBottom: 12 }}
        >
          {KID_NAME.toUpperCase()}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", border: `2px solid ${level.color}`, background: `${level.color}11`, borderRadius: 2 }}>
          <span style={{ fontFamily: "var(--pixel)", fontSize: 11, color: level.color }}>LVL {level.level}</span>
          <span style={{ fontFamily: "var(--pixel)", fontSize: 11, color: "var(--dim)" }}>·</span>
          <span style={{ fontFamily: "var(--pixel)", fontSize: 11, color: level.color }}>{level.name}</span>
        </div>
      </div>

      {/* Big points */}
      <div className="pcard pcard-gold" style={{ textAlign: "center", padding: "36px 16px" }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", letterSpacing: 3, marginBottom: 14 }}>
          CURRENT POINTS
        </div>
        <div
          className="anim-glow"
          style={{ fontFamily: "var(--pixel)", fontSize: 60, color: "var(--gold)", lineHeight: 1 }}
        >
          {data === null ? "—" : displayPts.toLocaleString()}
        </div>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginTop: 14 }}>
          ⭐ {data === null ? "—" : displayTotal.toLocaleString()} EARNED TOTAL
        </div>
      </div>

      {/* Level progress */}
      <div className="pcard">
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--pixel)", fontSize: 10, marginBottom: 10 }}>
          <span style={{ color: level.color }}>{level.name}</span>
          <span style={{ color: "var(--dim)" }}>{next ? next.name : "MAX LEVEL 🏆"}</span>
        </div>
        <div className="ptrack" style={{ height: 20, marginBottom: 8 }}>
          <div
            className="pfill"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${level.color}88, ${level.color})`, boxShadow: `0 0 10px ${level.color}99` }}
          />
        </div>
        {next && (
          <div style={{ textAlign: "right", fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)" }}>
            {(next.min - totalEarned).toLocaleString()} pts to {next.name}
          </div>
        )}
      </div>

      {/* Recent activity */}
      {allActivity.length > 0 ? (
        <div className="pcard">
          <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)", marginBottom: 12, letterSpacing: 2 }}>
            RECENT ACTIVITY
          </div>
          {allActivity.map((h, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < allActivity.length - 1 ? "1px solid var(--bg3)" : "none" }}
            >
              <div style={{ fontSize: 24, width: 36, textAlign: "center" }}>{h.type === "earn" ? "⭐" : "🛍️"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{h.label}</div>
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginTop: 4 }}>{h.date}</div>
              </div>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 15, color: h.type === "earn" ? "var(--green)" : "var(--red)", minWidth: 60, textAlign: "right" }}>
                {h.type === "earn" ? "+" : "-"}{h.amount}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", lineHeight: 3 }}>
          NO POINTS YET!<br />ASK DAD TO<br />AWARD YOUR FIRST POINTS!
        </div>
      )}
    </div>
  );
}
