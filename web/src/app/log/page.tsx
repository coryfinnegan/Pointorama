"use client";
import { useEffect, useRef, useState } from "react";
import type { PointsLog, Redemption } from "@/db/schema";

type Entry =
  | { kind: "earn"; id: number; label: string; amount: number; ts: number; date: string }
  | { kind: "spend"; id: number; label: string; amount: number; ts: number; date: string; status: string };

type ChartPt = { ts: number; balance: number; delta: number; isSpend: boolean };

function BalanceChart({ data }: { data: ChartPt[] }) {
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)";
      el.style.strokeDashoffset = "0";
    });
  }, [data]);

  if (data.length < 2) return null;

  const W = 320, H = 148;
  const PL = 40, PR = 10, PT = 10, PB = 30;
  const gW = W - PL - PR, gH = H - PT - PB;

  const minBal = Math.min(0, ...data.map((d) => d.balance));
  const maxBal = Math.max(10, ...data.map((d) => d.balance));
  const minTs = data[0].ts;
  const maxTs = data[data.length - 1].ts;
  const tsSpan = maxTs - minTs || 1;
  const balSpan = maxBal - minBal || 1;

  const cx = (ts: number) => PL + ((ts - minTs) / tsSpan) * gW;
  const cy = (bal: number) => PT + (1 - (bal - minBal) / balSpan) * gH;

  const pts = data.map((d) => ({ x: cx(d.ts), y: cy(d.balance), d }));

  // Smooth line using cardinal spline
  function smoothPath(points: { x: number; y: number }[]) {
    if (points.length < 2) return "";
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const mx = (prev.x + curr.x) / 2;
      d += ` C${mx.toFixed(1)},${prev.y.toFixed(1)} ${mx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
    }
    return d;
  }

  const linePath = smoothPath(pts);
  const zeroY = cy(0);
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${zeroY} L${pts[0].x.toFixed(1)},${zeroY}Z`;

  const TICKS = 4;
  const yTicks = Array.from({ length: TICKS + 1 }, (_, i) => {
    const val = minBal + (balSpan * i) / TICKS;
    return { val: Math.round(val), y: cy(val) };
  });

  // X-axis date labels (up to 4)
  const xLabelCount = Math.min(4, data.length);
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1));
    const d = data[idx];
    return { x: cx(d.ts), label: new Date(d.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  });

  return (
    <div className="pcard" style={{ padding: "14px 10px 10px", marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 10, letterSpacing: 2 }}>
        ⭐ BALANCE OVER TIME
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PL} y1={t.y} x2={W - PR} y2={t.y} stroke="#1a1a3a" strokeWidth={1} strokeDasharray="3 5" />
            <text x={PL - 4} y={t.y + 3} textAnchor="end" fontSize={7} fill="#444466" fontFamily="monospace">
              {t.val}
            </text>
          </g>
        ))}

        {/* Zero line */}
        <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY} stroke="#2a2a4a" strokeWidth={1} />

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Glowing line */}
        <path
          ref={lineRef}
          d={linePath}
          fill="none"
          stroke="#ffd700"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Transaction dots */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.d.isSpend ? 4 : 3.5}
            fill={p.d.isSpend ? "#ff4455" : "#00ff88"}
            filter="url(#dotGlow)"
          />
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 2} textAnchor="middle" fontSize={7} fill="#444466" fontFamily="monospace">
            {l.label}
          </text>
        ))}

        {/* Axes */}
        <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#2a2a4a" strokeWidth={1} />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: 10, color: "#6666aa" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", display: "inline-block", boxShadow: "0 0 6px #00ff88" }} />
          EARNED
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: 10, color: "#6666aa" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4455", display: "inline-block", boxShadow: "0 0 6px #ff4455" }} />
          SPENT
        </div>
      </div>
    </div>
  );
}

export default function LogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [chartData, setChartData] = useState<ChartPt[]>([]);
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
        ts: new Date(l.createdAt + "Z").getTime(),
        date: new Date(l.createdAt + "Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
      const spendEntries: Entry[] = reds.map((r) => ({
        kind: "spend",
        id: r.id,
        label: r.prizeName,
        amount: r.pointsSpent,
        ts: new Date(r.redeemedAt + "Z").getTime(),
        date: new Date(r.redeemedAt + "Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        status: r.status,
      }));

      const all = [...earnEntries, ...spendEntries].sort((a, b) => b.ts - a.ts);
      setEntries(all);

      // Build chart data in chronological order
      const events = [
        ...pts.logs.map((l) => ({ ts: new Date(l.createdAt + "Z").getTime(), delta: l.amount, isSpend: false })),
        ...reds.filter((r) => r.status !== "cancelled").map((r) => ({
          ts: new Date(r.redeemedAt + "Z").getTime(), delta: -r.pointsSpent, isSpend: true,
        })),
      ].sort((a, b) => a.ts - b.ts);

      let bal = 0;
      setChartData(events.map((e) => { bal += e.delta; return { ...e, balance: bal }; }));
    });
  }, []);

  return (
    <div className="game-screen">
      <div style={{ paddingTop: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: "var(--gold)", marginBottom: 16 }}>
          📜 POINT LOG
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
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

      <BalanceChart data={chartData} />

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", paddingTop: 60, lineHeight: 3 }}>
          NO HISTORY YET!<br />GET EARNING!
        </div>
      ) : (
        entries.map((h) => (
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
            <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: h.kind === "earn" ? (h.amount < 0 ? "var(--red)" : "var(--green)") : "var(--red)", minWidth: 60, textAlign: "right" }}>
              {h.kind === "earn" ? (h.amount > 0 ? "+" : "") : "-"}{Math.abs(h.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
