"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Prize, Redemption } from "@/db/schema";

async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  confetti({ particleCount: 200, spread: 90, origin: { y: 0.55 }, colors: ["#ffd700","#ff4455","#00ff88","#4488ff","#ff44dd","#ffaa00"] });
}

export default function ShopPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [available, setAvailable] = useState(0);
  const [confirming, setConfirming] = useState<Prize | null>(null);
  const [justBought, setJustBought] = useState<Prize | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  async function load() {
    const [pts, redemptions, prizeList] = await Promise.all([
      fetch("/api/points").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
      fetch("/api/prizes").then((r) => r.json()),
    ]);
    const spent = (redemptions as Redemption[]).filter((r) => r.status !== "cancelled").reduce((s: number, r: Redemption) => s + r.pointsSpent, 0);
    setAvailable(pts.total - spent);
    setPrizes(prizeList);
  }

  useEffect(() => { load(); }, []);

  async function redeem() {
    if (!confirming) return;
    setLoading(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prizeId: confirming.id }),
    });
    setLoading(false);
    setConfirming(null);
    if (res.ok) {
      const prize = confirming;
      setJustBought(prize);
      await fireConfetti();
      setTimeout(() => setJustBought(null), 4000);
      load();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Something went wrong");
    }
  }

  if (justBought) {
    return (
      <div className="game-screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        {justBought.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={justBought.imageUrl} alt={justBought.name} className="anim-pop" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 4, marginBottom: 20, border: "3px solid var(--gold)", boxShadow: "0 0 30px rgba(255,215,0,0.5)" }} />
        ) : (
          <div className="anim-pop" style={{ fontSize: 88, marginBottom: 20 }}>🎁</div>
        )}
        <div style={{ fontFamily: "var(--pixel)", fontSize: 13, color: "var(--gold)", textAlign: "center", marginBottom: 10 }} className="anim-glow">
          REWARD UNLOCKED!
        </div>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 10, color: "var(--text)", textAlign: "center", marginBottom: 8 }}>{justBought.name}</div>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", textAlign: "center" }}>GO FIND DAD TO REDEEM!</div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* Header */}
      <div style={{ paddingTop: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: "var(--gold)" }}>🛍️ REWARD SHOP</div>
        <div style={{ fontFamily: "var(--pixel)", fontSize: 11, color: "var(--dim)", marginTop: 8 }}>
          YOU HAVE ⭐ {available.toLocaleString()} POINTS
        </div>
      </div>

      {prizes.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "var(--pixel)", fontSize: 10, color: "var(--dim)", lineHeight: 3 }}>
          NO PRIZES YET!<br />CHECK BACK SOON!
        </div>
      )}

      {/* Confirm modal */}
      {confirming && (() => {
        const canAfford = available >= confirming.pointCost;
        const need = confirming.pointCost - available;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, padding: 24 }}>
            <div className="pcard anim-pop" style={{ width: "100%", maxWidth: 320, textAlign: "center", padding: 28 }}>
              {confirming.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={confirming.imageUrl} alt={confirming.name} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 4, marginBottom: 16, border: `2px solid ${canAfford ? "var(--gold)" : "var(--bg3)"}` }} />
              ) : (
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎁</div>
              )}
              <div style={{ fontFamily: "var(--pixel)", fontSize: 11, color: canAfford ? "var(--gold)" : "var(--dim)", marginBottom: 8 }}>
                {canAfford ? "BUY THIS?" : "🔒 LOCKED"}
              </div>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--text)", marginBottom: 6 }}>{confirming.name}</div>
              <div style={{ fontFamily: "var(--pixel)", fontSize: 9, color: canAfford ? "var(--red)" : "var(--dim)", marginBottom: 6 }}>
                COST: {confirming.pointCost} ⭐
              </div>
              {canAfford && (
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--dim)", marginBottom: 6 }}>
                  {(available - confirming.pointCost).toLocaleString()} ⭐ LEFT AFTER
                </div>
              )}
              {!canAfford && (
                <div style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "var(--red)", marginBottom: 6 }}>
                  NEED {need.toLocaleString()} MORE ⭐
                </div>
              )}
              {confirming.description && (
                <div style={{ fontSize: 13, color: "var(--dim)", marginBottom: 20 }}>{confirming.description}</div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {canAfford && (
                  <button className="pbtn pbtn-gold" onClick={redeem} disabled={loading}>
                    {loading ? "..." : "YES!"}
                  </button>
                )}
                <button className="pbtn pbtn-dim" onClick={() => setConfirming(null)}>BACK</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14 }}>
        {prizes.map((prize) => {
          const can = available >= prize.pointCost;
          return (
            <div
              key={prize.id}
              className="pcard"
              onClick={() => setConfirming(prize)}
              style={{
                cursor: "pointer",
                padding: 0,
                overflow: "hidden",
                border: can ? "2px solid rgba(255,215,0,0.35)" : "2px solid var(--bg3)",
                transition: "transform 0.15s, border-color 0.2s",
                marginBottom: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; setHoveredId(prize.id); }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; setHoveredId(null); }}
            >
              {/* Image or emoji */}
              <div style={{ width: "100%", height: 140, background: "var(--bg3)", overflow: "hidden", position: "relative" }}>
                {prize.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prize.imageUrl}
                    alt={prize.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
                    🎁
                  </div>
                )}
                {/* Green "can afford" dot */}
                {can && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 10, height: 10, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
                )}
                {/* Hover overlay: remaining points */}
                {hoveredId === prize.id && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(0,0,0,0.78)",
                    padding: "7px 10px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {can ? (
                      <>
                        <span style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "#fff" }}>LEFT AFTER:</span>
                        <span style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--gold)" }}>
                          {(available - prize.pointCost).toLocaleString()} ⭐
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily: "var(--pixel)", fontSize: 8, color: "#fff" }}>NEED:</span>
                        <span style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--red)" }}>
                          {(prize.pointCost - available).toLocaleString()} ⭐ more
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "10px 12px 14px" }}>
                <div style={{ fontFamily: "var(--pixel)", fontSize: 9, marginBottom: 8, lineHeight: 1.8, color: "var(--text)" }}>{prize.name}</div>
                <div style={{ fontFamily: "var(--pixel)", fontSize: 14, color: can ? "var(--gold)" : "var(--dim)" }}>
                  {prize.pointCost} ⭐
                </div>
                {!can && (
                  <div style={{ fontFamily: "var(--pixel)", fontSize: 7, color: "var(--red)", marginTop: 6 }}>
                    NEED {(prize.pointCost - available).toLocaleString()} MORE
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
