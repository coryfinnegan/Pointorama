"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Prize, Redemption } from "@/db/schema";

async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 160,
    spread: 90,
    origin: { y: 0.55 },
    colors: ["#6366f1", "#a855f7", "#ec4899", "#facc15", "#34d399"],
  });
}

export default function ShopPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [available, setAvailable] = useState(0);
  const [confirming, setConfirming] = useState<Prize | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [pts, redemptions, prizeList] = await Promise.all([
      fetch("/api/points").then((r) => r.json()),
      fetch("/api/redemptions").then((r) => r.json()),
      fetch("/api/prizes").then((r) => r.json()),
    ]);
    const spent = (redemptions as Redemption[])
      .filter((r) => r.status !== "cancelled")
      .reduce((s: number, r: Redemption) => s + r.pointsSpent, 0);
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
      await fireConfetti();
      toast.success(`🎉 "${confirming.name}" redeemed! Ask Dad to get it for you.`);
      load();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Something went wrong");
    }
  }

  const affordable = prizes.filter((p) => available >= p.pointCost);
  const tooExpensive = prizes.filter((p) => available < p.pointCost);

  return (
    <div className="space-y-8">
      {/* Header with points balance */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide mb-1">Your Balance</p>
          <p className="text-5xl font-extrabold tabular-nums">{available}</p>
          <p className="text-indigo-200 mt-1">points to spend</p>
        </div>
        <div className="absolute -right-8 -bottom-8 text-[120px] opacity-10 select-none">⭐</div>
      </div>

      {prizes.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🎁</p>
          <p className="text-lg font-medium">No prizes yet — check back soon!</p>
        </div>
      )}

      {/* Affordable prizes */}
      {affordable.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3">You can get these!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {affordable.map((prize) => (
              <PrizeCard
                key={prize.id}
                prize={prize}
                canAfford
                onRedeem={() => setConfirming(prize)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Too expensive */}
      {tooExpensive.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-400 mb-3">Keep earning for these</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 opacity-70">
            {tooExpensive.map((prize) => (
              <PrizeCard
                key={prize.id}
                prize={prize}
                canAfford={false}
                available={available}
                onRedeem={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!confirming} onOpenChange={() => setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {confirming?.name}?</DialogTitle>
            <DialogDescription>
              This will use <strong>{confirming?.pointCost} points</strong>. You&apos;ll have{" "}
              <strong>{available - (confirming?.pointCost ?? 0)} points</strong> left.
              Dad will buy it for you!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              onClick={redeem}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Redeeming..." : "Yes, Redeem! 🎉"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrizeCard({
  prize,
  canAfford,
  available,
  onRedeem,
}: {
  prize: Prize;
  canAfford: boolean;
  available?: number;
  onRedeem: () => void;
}) {
  const needed = available !== undefined ? prize.pointCost - available : 0;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden shadow-md transition-all duration-200 ${
        canAfford ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer" : "cursor-default"
      } bg-white`}
      onClick={canAfford ? onRedeem : undefined}
    >
      {/* Image area */}
      <div className="relative w-full h-48 bg-indigo-50 overflow-hidden">
        {prize.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prize.imageUrl}
            alt={prize.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              canAfford ? "group-hover:scale-105" : "grayscale"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>
        )}

        {/* Cost badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-indigo-700 font-bold text-sm px-2.5 py-1 rounded-full shadow">
            {prize.pointCost} pts
          </span>
        </div>

        {/* Affordability overlay for too-expensive */}
        {!canAfford && needed > 0 && (
          <div className="absolute inset-0 flex items-end p-3">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              Need {needed} more pts
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-1">
        <p className="font-bold text-gray-800 leading-snug">{prize.name}</p>
        {prize.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{prize.description}</p>
        )}
        {canAfford && (
          <div className="mt-auto pt-3">
            <div className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl text-center transition-colors">
              Redeem!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
