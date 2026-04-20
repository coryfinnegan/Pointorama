"use client";
import { useEffect, useRef, useState } from "react";
import { getLevel } from "@/lib/levels";
import type { PointsLog, Redemption, AllowanceSettings } from "@/db/schema";

type PointsData = { total: number; logs: PointsLog[]; allowance: AllowanceSettings };
type MoneyData = { totalCents: number };

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

function AllowanceCard({ al }: { al: AllowanceSettings }) {
  const [now, setNow] = useState(Date.now());

  // Tick every minute so the countdown updates
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!al.enabled || !al.weeklyAmount || !al.nextPayAt) return null;

  const nextMs = new Date(al.nextPayAt).getTime();
  const msLeft = Math.max(0, nextMs - now);
  const daysLeft = Math.floor(msLeft / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const pct = Math.min(100, Math.max(0, ((7 * 24 * 60 * 60 * 1000 - msLeft) / (7 * 24 * 60 * 60 * 1000)) * 100));

  const isDueNow = msLeft === 0;

  return (
    <div
      className="pcard"
      style={{
        border: isDueNow ? "2px solid var(--green)" : "2px solid rgba(68,136,255,0.4)",
        background: isDueNow ? "rgba(0,255,136,0.06)" : "rgba(68,136,255,0.06)",
        padding: "20px 20px 16px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: isDueNow ? "var(--green)" : "var(--blue)", letterSpacing: 2 }}>
          💰 WEEKLY ALLOWANCE
        </div>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: isDueNow ? "var(--green)" : "var(--blue)" }}>
          +{al.weeklyAmount} ⭐
        </div>
      </div>

      {/* Progress bar */}
      <div className="ptrack" style={{ height: 12, marginBottom: 10 }}>
        <div
          className="pfill"
          style={{
            width: `${pct}%`,
            background: isDueNow
              ? `linear-gradient(90deg, var(--green)88, var(--green))`
              : `linear-gradient(90deg, #4488ff88, #4488ff)`,
            boxShadow: isDueNow ? "0 0 10px var(--green)" : "0 0 10px #4488ff",
          }}
        />
      </div>

      {/* Countdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {isDueNow ? (
          <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--green)" }} className="anim-glow">
            BEING ADDED NOW!
          </div>
        ) : (
          <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--dim)" }}>
            {daysLeft > 0 ? (
              <><span style={{ color: "var(--text)", fontSize: 14 }}>{daysLeft}</span> day{daysLeft !== 1 ? "s" : ""} {hoursLeft}h</>
            ) : (
              <><span style={{ color: "var(--blue)", fontSize: 14 }}>{hoursLeft}</span> hrs</>
            )}
            {" "}until payday
          </div>
        )}
        <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)" }}>
          {new Date(al.nextPayAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<PointsData | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [money, setMoney] = useState<MoneyData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/points").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
      fetch("/api/money").then((r) => r.json()),
    ]).then(([pts, red, mon]) => { setData(pts); setRedemptions(red); setMoney(mon); });
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

      {/* Money balance */}
      {money !== null && money.totalCents > 0 && (
        <div className="pcard pcard-green" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", letterSpacing: 3, marginBottom: 10 }}>
            💵 MONEY SAVED
          </div>
          <div
            className="anim-glow"
            style={{ fontFamily: "var(--pixel)", fontSize: 44, color: "var(--green)", lineHeight: 1 }}
          >
            ${(money.totalCents / 100).toFixed(2)}
          </div>
        </div>
      )}

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

      {/* Allowance countdown */}
      {data?.allowance && <AllowanceCard al={data.allowance} />}

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
