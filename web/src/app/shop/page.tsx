"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-700">Prize Shop 🎁</h1>
        <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
          {available} points available
        </Badge>
      </div>

      {prizes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-400 text-lg">No prizes yet — check back soon!</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {prizes.map((prize) => {
          const canAfford = available >= prize.pointCost;
          return (
            <Card
              key={prize.id}
              className={`flex flex-col transition-all ${canAfford ? "border-indigo-200 hover:shadow-lg hover:scale-[1.02]" : "opacity-60 grayscale"}`}
            >
              {prize.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prize.imageUrl}
                  alt={prize.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-32 bg-indigo-100 rounded-t-lg flex items-center justify-center text-5xl">
                  🎁
                </div>
              )}
              <CardHeader className="pb-1">
                <CardTitle className="text-lg">{prize.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {prize.description && (
                  <p className="text-sm text-gray-500">{prize.description}</p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <Badge variant="outline" className="text-base font-bold border-indigo-400 text-indigo-600">
                  {prize.pointCost} pts
                </Badge>
                <Button
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => setConfirming(prize)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {canAfford ? "Redeem!" : "Need more points"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

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
            <Button onClick={redeem} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Redeeming..." : "Yes, Redeem!"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
